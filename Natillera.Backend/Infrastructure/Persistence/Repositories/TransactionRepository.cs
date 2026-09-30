using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class TransactionRepository(NatilleraDbContext dbContext) : ITransactionRepository
{
    public Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default) =>
        dbContext.Transactions.AddAsync(transaction, cancellationToken).AsTask();

    public async Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Transactions
            .OrderByDescending(transaction => transaction.OccurredAt)
            .Select(transaction => new TransactionListItem(
                transaction.Id,
                transaction.Amount,
                transaction.Direction,
                transaction.Type,
                transaction.OccurredAt,
                transaction.Description,
                dbContext.MonthlyPayments
                    .Where(payment => payment.TransactionId == transaction.Id)
                    .Select(payment => payment.User.FirstName + " " + payment.User.LastName)
                    .FirstOrDefault()))
            .ToListAsync(cancellationToken);
    }

    public async Task<TransactionDetailResponse?> GetDetailAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var transaction = await dbContext.Transactions.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (transaction is null) return null;

        return transaction.Type switch
        {
            Domain.Enums.TransactionType.MonthlyPayment => await GetMonthlyPaymentDetailAsync(transaction, cancellationToken),
            Domain.Enums.TransactionType.Loan => await GetLoanDetailAsync(transaction, cancellationToken),
            Domain.Enums.TransactionType.LoanPayment => await GetLoanPaymentDetailAsync(transaction, cancellationToken),
            Domain.Enums.TransactionType.Performance => await GetPerformanceDetailAsync(transaction, cancellationToken),
            Domain.Enums.TransactionType.Activity => await GetActivityDetailAsync(transaction, cancellationToken),
            Domain.Enums.TransactionType.ActivitySale => await GetActivityAssignmentDetailAsync(transaction, cancellationToken),
            _ => throw new InvalidOperationException($"Unsupported transaction type: {transaction.Type}.")
        };
    }

    private async Task<TransactionDetailResponse> GetMonthlyPaymentDetailAsync(Transaction transaction, CancellationToken cancellationToken)
    {
        var payment = await dbContext.MonthlyPayments.Include(item => item.User).SingleAsync(item => item.TransactionId == transaction.Id, cancellationToken);
        return Build(transaction, new TransactionSourceDetail { Entity = "MonthlyPayment", EntityId = payment.Id, MemberName = payment.User.FirstName + " " + payment.User.LastName, Year = payment.Year, Month = payment.Month, Status = payment.Status.ToString(), PaidAt = payment.PaidAt });
    }

    private async Task<TransactionDetailResponse> GetLoanDetailAsync(Transaction transaction, CancellationToken cancellationToken)
    {
        var loan = await dbContext.Loans.Include(item => item.Borrower).SingleAsync(item => item.TransactionId == transaction.Id, cancellationToken);
        return Build(transaction, new TransactionSourceDetail { Entity = "Loan", EntityId = loan.Id, MemberName = loan.Borrower.FirstName + " " + loan.Borrower.LastName, Status = loan.Status.ToString(), InitialAmount = loan.InitialAmount, InterestRate = loan.InterestRate, LoanStartDate = loan.StartDate, LoanEndDate = loan.EndDate });
    }

    private async Task<TransactionDetailResponse> GetLoanPaymentDetailAsync(Transaction transaction, CancellationToken cancellationToken)
    {
        var payment = await dbContext.LoanPayments.Include(item => item.Loan).ThenInclude(item => item.Borrower).SingleAsync(item => item.TransactionId == transaction.Id, cancellationToken);
        return Build(transaction, new TransactionSourceDetail { Entity = "LoanPayment", EntityId = payment.Id, MemberName = payment.Loan.Borrower.FirstName + " " + payment.Loan.Borrower.LastName, Status = payment.Loan.Status.ToString(), PaidAt = payment.PaidAt, InitialAmount = payment.Loan.InitialAmount, InterestRate = payment.Loan.InterestRate, LoanStartDate = payment.Loan.StartDate, LoanEndDate = payment.Loan.EndDate, PaymentMethod = payment.PaymentMethod.ToString() });
    }

    private async Task<TransactionDetailResponse> GetPerformanceDetailAsync(Transaction transaction, CancellationToken cancellationToken)
    {
        var performance = await dbContext.Performances.Include(item => item.Loan).ThenInclude(item => item.Borrower).SingleAsync(item => item.TransactionId == transaction.Id, cancellationToken);
        return Build(transaction, new TransactionSourceDetail { Entity = "Performance", EntityId = performance.Id, MemberName = performance.Loan.Borrower.FirstName + " " + performance.Loan.Borrower.LastName, Status = performance.Status.ToString(), PaidAt = performance.PaidAt, ActivityDescription = performance.Description, InitialAmount = performance.Loan.InitialAmount, InterestRate = performance.Loan.InterestRate, LoanStartDate = performance.Loan.StartDate, LoanEndDate = performance.Loan.EndDate });
    }

    private async Task<TransactionDetailResponse> GetActivityDetailAsync(Transaction transaction, CancellationToken cancellationToken)
    {
        var activity = await dbContext.Activities.SingleAsync(item => item.TransactionId == transaction.Id, cancellationToken);
        return Build(transaction, new TransactionSourceDetail { Entity = "Activity", EntityId = activity.Id, Status = activity.Status.ToString(), ActivityName = activity.Name, ActivityDescription = activity.Description, ActivityQuantity = activity.Quantity, UnitCost = activity.UnitCost, UnitSalePrice = activity.UnitSalePrice, StartDate = activity.StartDate });
    }

    private async Task<TransactionDetailResponse> GetActivityAssignmentDetailAsync(Transaction transaction, CancellationToken cancellationToken)
    {
        var assignment = await dbContext.ActivityAssignments.Include(item => item.Activity).Include(item => item.User).SingleAsync(item => item.TransactionId == transaction.Id, cancellationToken);
        return Build(transaction, new TransactionSourceDetail { Entity = "ActivityAssignment", EntityId = assignment.Id, MemberName = assignment.User.FirstName + " " + assignment.User.LastName, Status = assignment.Status.ToString(), PaidAt = assignment.PaidAt, ActivityName = assignment.Activity.Name, ActivityDescription = assignment.Activity.Description, ActivityQuantity = assignment.Activity.Quantity, QuantityAssigned = assignment.QuantityAssigned, UnitCost = assignment.Activity.UnitCost, UnitSalePrice = assignment.Activity.UnitSalePrice, StartDate = assignment.Activity.StartDate, AssignedAt = assignment.AssignedAt });
    }

    private static TransactionDetailResponse Build(Transaction transaction, TransactionSourceDetail source) => new(transaction.Id, transaction.Amount, transaction.Direction, transaction.Type, transaction.OccurredAt, transaction.Description, source);
}
