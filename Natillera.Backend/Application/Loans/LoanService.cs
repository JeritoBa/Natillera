using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Loans;

public sealed class LoanService(
    IUserRepository memberReader,
    ILoanRepository loanRepository,
    ITransactionRepository transactionRepository,
    ILogRepository logRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<IReadOnlyCollection<LoanListItem>> GetListAsync(SavingPeriod period, CancellationToken cancellationToken)
    {
        var loans = await loanRepository.GetListAsync(period.Id, cancellationToken);
        return loans
            .Select(loan => new LoanListItem(
                loan.Id,
                loan.BorrowerId,
                loan.BorrowerName,
                loan.InitialAmount,
                loan.InterestRate,
                loan.StartDate,
                loan.Status,
                Math.Max(0, loan.InitialAmount - loan.PrincipalPaid)))
            .ToArray();
    }

    public async Task<LoanDetailResponse?> GetDetailAsync(Guid id, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await loanRepository.GetDetailAsync(id, period.Id, cancellationToken);
        return loan is null ? null : ToDetail(loan, BorrowerName(loan.Borrower));
    }

    public async Task<LoanPaymentResponse?> GetPaymentAsync(Guid loanId, Guid paymentId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await GetDetailAsync(loanId, period, cancellationToken);
        return loan?.Payments.FirstOrDefault(payment => payment.Id == paymentId);
    }

    public async Task<InterestPaymentResponse?> GetInterestAsync(Guid loanId, Guid interestId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await GetDetailAsync(loanId, period, cancellationToken);
        return loan?.InterestPayments.FirstOrDefault(interest => interest.Id == interestId);
    }

    public async Task<LoanDetailResponse> CreateLoanAsync(LoanRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var member = await GetActiveMemberAsync(request.BorrowerId, cancellationToken);
        var borrowerName = BorrowerName(member);

        var transaction = new Transaction(
            request.InitialAmount,
            TransactionDirection.Expense,
            TransactionType.Loan,
            $"Loan - {borrowerName}",
            period.Id);
        var loan = new Loan(request.InitialAmount, request.InterestRate, ToUtcDate(request.StartDate), request.BorrowerId, transaction.Id, period);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            CashGuard.EnsureAvailable(await transactionRepository.GetAvailableMoneyAsync(period.Id, ct), loan.InitialAmount); // FIN-13
            await transactionRepository.AddAsync(transaction, ct);
            await loanRepository.AddAsync(loan, ct);
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Loan, loan.Id, LogAction.Create, loan.SavingPeriodId, null, loan.InitialAmount),
                ct);
        }, cancellationToken);

        return ToDetail(loan, borrowerName);
    }

    public async Task<LoanDetailResponse> UpdateLoanAsync(Guid loanId, LoanRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        var member = await GetActiveMemberAsync(request.BorrowerId, cancellationToken);
        var borrowerName = BorrowerName(member);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var available = await transactionRepository.GetAvailableMoneyAsync(loan.SavingPeriodId, ct);
            var oldAmount = loan.InitialAmount;
            loan.UpdateDetails(request.InitialAmount, request.InterestRate, ToUtcDate(request.StartDate), request.BorrowerId, period);
            CashGuard.EnsureAvailable(available, loan.InitialAmount - oldAmount); // FIN-13
            loan.Transaction.Update(loan.InitialAmount, TransactionDirection.Expense, TransactionType.Loan, $"Loan - {borrowerName}");
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Loan, loan.Id, LogAction.Update, loan.SavingPeriodId, oldAmount, loan.InitialAmount),
                ct);
        }, cancellationToken);

        return ToDetail(loan, borrowerName);
    }

    public async Task CancelLoanAsync(Guid loanId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            loan.Cancel();
            loan.Transaction.Cancel();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Loan, loan.Id, LogAction.Delete, loan.SavingPeriodId, loan.InitialAmount, null),
                ct);
        }, cancellationToken);
    }

    public async Task<LoanPaymentResponse> CreatePaymentAsync(Guid loanId, LoanPaymentRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var method = GetPaymentMethod(request);
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        var transaction = new Transaction(
            request.Amount,
            TransactionDirection.Income,
            TransactionType.LoanPayment,
            $"Loan payment - {BorrowerName(loan.Borrower)}",
            loan.SavingPeriodId);
        LoanPayment? payment = null;

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            payment = loan.RegisterPayment(request.Amount, method, transaction.Id);
            await transactionRepository.AddAsync(transaction, ct);
            await loanRepository.AddPaymentAsync(payment, ct);
            loan.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.LoanPayment, payment.Id, LogAction.Create, loan.SavingPeriodId, null, payment.Amount),
                ct);
        }, cancellationToken);

        return ToPayment(payment!);
    }

    public async Task<LoanPaymentResponse> UpdatePaymentAsync(Guid loanId, Guid paymentId, LoanPaymentRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var method = GetPaymentMethod(request);
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        var payment = FindPayment(loan, paymentId);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var available = await transactionRepository.GetAvailableMoneyAsync(loan.SavingPeriodId, ct);
            var oldAmount = payment.Amount;
            loan.UpdatePayment(payment, request.Amount, method);
            CashGuard.EnsureAvailable(available, oldAmount - payment.Amount); // FIN-13
            payment.Transaction.Update(
                payment.Amount,
                TransactionDirection.Income,
                TransactionType.LoanPayment,
                $"Loan payment - {BorrowerName(loan.Borrower)}");
            loan.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.LoanPayment, payment.Id, LogAction.Update, loan.SavingPeriodId, oldAmount, payment.Amount),
                ct);
        }, cancellationToken);

        return ToPayment(payment);
    }

    public async Task CancelPaymentAsync(Guid loanId, Guid paymentId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        var payment = FindPayment(loan, paymentId);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            payment.Cancel();
            payment.Transaction.Cancel();
            loan.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.LoanPayment, payment.Id, LogAction.Delete, loan.SavingPeriodId, payment.Amount, null),
                ct);
        }, cancellationToken);
    }

    public async Task<InterestPaymentResponse> CreateInterestAsync(Guid loanId, InterestPaymentRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var status = GetInterestStatus(request);
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        Performance? performance = null;

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            performance = loan.RegisterInterest(request.Amount, request.Description);
            await loanRepository.AddPerformanceAsync(performance, ct);
            if (status == PaymentStatus.Paid)
            {
                var transaction = NewInterestTransaction(loan, performance);
                await transactionRepository.AddAsync(transaction, ct);
                performance.MarkAsPaid(transaction.Id);
            }

            loan.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Performance, performance.Id, LogAction.Create, loan.SavingPeriodId, null, performance.Amount),
                ct);
        }, cancellationToken);

        return ToInterest(performance!);
    }

    public async Task<InterestPaymentResponse> UpdateInterestAsync(Guid loanId, Guid interestId, InterestPaymentRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var status = GetInterestStatus(request);
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        var performance = FindInterest(loan, interestId);

        if (performance.Status == PaymentStatus.Paid && status == PaymentStatus.Pending)
            throw new DomainException("Paid interest cannot return to pending.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var wasPaid = performance.Status == PaymentStatus.Paid;
            var available = wasPaid ? await transactionRepository.GetAvailableMoneyAsync(loan.SavingPeriodId, ct) : 0m;
            var oldAmount = performance.Amount;
            performance.UpdateDetails(request.Amount, request.Description);
            if (wasPaid)
            {
                CashGuard.EnsureAvailable(available, oldAmount - performance.Amount); // FIN-13
                performance.Transaction!.Update(
                    performance.Amount,
                    TransactionDirection.Income,
                    TransactionType.Performance,
                    InterestDescription(loan));
            }
            else if (status == PaymentStatus.Paid)
            {
                var transaction = NewInterestTransaction(loan, performance);
                await transactionRepository.AddAsync(transaction, ct);
                performance.MarkAsPaid(transaction.Id);
            }

            loan.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Performance, performance.Id, LogAction.Update, loan.SavingPeriodId, oldAmount, performance.Amount),
                ct);
        }, cancellationToken);

        return ToInterest(performance);
    }

    public async Task CancelInterestAsync(Guid loanId, Guid interestId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var loan = await GetLoanForUpdateAsync(loanId, period, cancellationToken);
        var performance = FindInterest(loan, interestId);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var wasPaid = performance.Status == PaymentStatus.Paid;
            performance.Cancel();
            if (wasPaid)
                performance.Transaction!.Cancel();

            loan.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Performance, performance.Id, LogAction.Delete, loan.SavingPeriodId, performance.Amount, null),
                ct);
        }, cancellationToken);
    }

    private async Task<User> GetActiveMemberAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var member = await memberReader.GetMemberByIdAsync(memberId, cancellationToken)
            ?? throw new DomainException("Member not found.");

        if (!member.IsActive)
            throw new DomainException("Only active members can receive a loan.");

        return member;
    }

    private async Task<Loan> GetLoanForUpdateAsync(Guid loanId, SavingPeriod period, CancellationToken cancellationToken) =>
        await loanRepository.GetForUpdateAsync(loanId, period.Id, cancellationToken)
            ?? throw new DomainException("Loan not found.");

    private static LoanPayment FindPayment(Loan loan, Guid paymentId) =>
        loan.Payments.FirstOrDefault(payment => payment.Id == paymentId)
            ?? throw new DomainException("Loan payment not found.");

    private static Performance FindInterest(Loan loan, Guid interestId) =>
        loan.Performances.FirstOrDefault(performance => performance.Id == interestId)
            ?? throw new DomainException("Interest payment not found.");

    private static PaymentMethod GetPaymentMethod(LoanPaymentRequest request)
    {
        if (request.PaymentMethod is not { } method || !Enum.IsDefined(method))
            throw new DomainException("Payment method is invalid.");

        return method;
    }

    private static PaymentStatus GetInterestStatus(InterestPaymentRequest request)
    {
        if (request.Status is not { } status || status == PaymentStatus.Cancelled || !Enum.IsDefined(status))
            throw new DomainException("Interest status must be Pending or Paid.");

        return status;
    }

    private static Transaction NewInterestTransaction(Loan loan, Performance performance) =>
        new(performance.Amount, TransactionDirection.Income, TransactionType.Performance, InterestDescription(loan), loan.SavingPeriodId);

    private static string InterestDescription(Loan loan) => $"Loan interest - {BorrowerName(loan.Borrower)}";

    private static DateTime ToUtcDate(DateTime date) => DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

    private static string BorrowerName(User borrower) => borrower.FirstName + " " + borrower.LastName;

    private static LoanDetailResponse ToDetail(Loan loan, string borrowerName)
    {
        var principalPaid = loan.PrincipalPaid();
        var outstandingPrincipal = loan.OutstandingPrincipal();
        var interestGenerated = loan.Performances
            .Where(performance => performance.Status != PaymentStatus.Cancelled)
            .Sum(performance => performance.Amount);
        var interestPaid = loan.Performances
            .Where(performance => performance.Status == PaymentStatus.Paid)
            .Sum(performance => performance.Amount);
        var outstandingInterest = loan.Performances
            .Where(performance => performance.Status == PaymentStatus.Pending)
            .Sum(performance => performance.Amount);

        return new LoanDetailResponse(
            loan.Id,
            loan.TransactionId,
            loan.BorrowerId,
            borrowerName,
            loan.InitialAmount,
            loan.InterestRate,
            loan.StartDate,
            loan.EndDate,
            loan.Status,
            loan.CreatedAt,
            loan.UpdatedAt,
            new LoanSummary(
                principalPaid,
                outstandingPrincipal,
                interestGenerated,
                interestPaid,
                outstandingInterest,
                outstandingPrincipal + outstandingInterest),
            loan.Payments.OrderBy(payment => payment.PaidAt).Select(ToPayment).ToArray(),
            loan.Performances.OrderBy(performance => performance.CreatedAt).Select(ToInterest).ToArray());
    }

    private static LoanPaymentResponse ToPayment(LoanPayment payment) =>
        new(payment.Id, payment.LoanId, payment.TransactionId, payment.Amount, payment.PaidAt, payment.PaymentMethod, payment.Status);

    private static InterestPaymentResponse ToInterest(Performance performance) =>
        new(performance.Id, performance.LoanId, performance.TransactionId, performance.Amount, performance.Description,
            performance.Status, performance.CreatedAt, performance.PaidAt);
}
