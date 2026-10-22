using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.MonthlyPayments;

public sealed class MonthlyPaymentService(
    IUserRepository memberReader,
    IMonthlyPaymentRepository paymentRepository,
    ITransactionRepository transactionRepository,
    ILogRepository logRepository,
    IUnitOfWork unitOfWork,
    MonthlyPaymentOptions options)
{
    public Task<IReadOnlyCollection<MonthlyPaymentListItem>> GetOrderedAsync(bool includeNonPaid, SavingPeriod period, CancellationToken cancellationToken) =>
        paymentRepository.GetOrderedAsync(includeNonPaid, period.Id, cancellationToken);

    public async Task<MonthlyPaymentResponse> CreateAsync(
        CreateMonthlyPaymentRequest request,
        Guid performedByUserId,
        SavingPeriod period,
        CancellationToken cancellationToken)
    {
        var status = GetRequestedStatus(request.Status);

        if (request.Amount < options.MinimumAmount)
            throw new DomainException($"Monthly payment must be at least {options.MinimumAmount:0.00}.");

        var member = await memberReader.GetMemberByIdAsync(request.UserId, cancellationToken)
            ?? throw new DomainException("Member not found.");

        if (!member.IsActive)
            throw new DomainException("Only active members can receive a monthly payment.");

        if (await paymentRepository.ExistsAsync(request.UserId, period.Id, request.Month, cancellationToken))
            throw new DomainException("A monthly payment already exists for this member and period.");

        var payment = new MonthlyPayment(request.Amount, request.Month, request.UserId, period.Id);

        try
        {
            await unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                await paymentRepository.AddAsync(payment, ct);
                if (status == PaymentStatus.Paid)
                {
                    var transaction = NewTransaction(payment, member, period.Year);
                    await transactionRepository.AddAsync(transaction, ct);
                    payment.MarkAsPaid(transaction.Id);
                }

                await logRepository.AddAsync(
                    new Log(performedByUserId, LogEntityType.MonthlyPayment, payment.Id, LogAction.Create, payment.SavingPeriodId, null, payment.Amount),
                    ct);
            }, cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is not null)
        {
            throw new DomainException("A monthly payment already exists for this member and period.");
        }

        return ToResponse(payment, member, period.Year);
    }

    public async Task<MonthlyPaymentResponse> UpdateAsync(Guid paymentId, UpdateMonthlyPaymentRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var status = GetRequestedStatus(request.Status);

        if (request.Amount < options.MinimumAmount)
            throw new DomainException($"Monthly payment must be at least {options.MinimumAmount:0.00}.");

        var payment = await paymentRepository.GetByIdAsync(paymentId, period.Id, cancellationToken)
            ?? throw new DomainException("Monthly payment not found.");

        if (payment.Status == PaymentStatus.Cancelled)
            throw new DomainException("Cancelled monthly payments cannot be modified.");
        if (payment.Status == PaymentStatus.Paid && status == PaymentStatus.Pending)
            throw new DomainException("Paid monthly payment cannot return to pending.");

        var member = await memberReader.GetMemberByIdAsync(request.UserId, cancellationToken)
            ?? throw new DomainException("Member not found.");

        if (!member.IsActive)
            throw new DomainException("Only active members can receive a monthly payment.");
        if (await paymentRepository.ExistsForAnotherPaymentAsync(request.UserId, payment.SavingPeriodId, request.Month, paymentId, cancellationToken))
            throw new DomainException("A monthly payment already exists for this member and period.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var wasPaid = payment.Status == PaymentStatus.Paid;
            var available = wasPaid ? await transactionRepository.GetAvailableMoneyAsync(payment.SavingPeriodId, ct) : 0m;
            var oldAmount = payment.Amount;
            payment.UpdateDetails(request.Amount, request.Month, request.UserId);
            if (wasPaid)
            {
                CashGuard.EnsureAvailable(available, oldAmount - payment.Amount); // FIN-13
                payment.Transaction!.Update(payment.Amount, TransactionDirection.Income, TransactionType.MonthlyPayment, Description(payment, member, period.Year));
            }
            else if (status == PaymentStatus.Paid)
            {
                if (payment.Transaction is { } existing)
                {
                    if (existing.IsCancelled)
                        throw new DomainException("Monthly payment transaction is cancelled and cannot be reused.");

                    existing.Update(payment.Amount, TransactionDirection.Income, TransactionType.MonthlyPayment, Description(payment, member, period.Year));
                    payment.MarkAsPaid(existing.Id);
                }
                else
                {
                    var transaction = NewTransaction(payment, member, period.Year);
                    await transactionRepository.AddAsync(transaction, ct);
                    payment.MarkAsPaid(transaction.Id);
                }
            }

            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.MonthlyPayment, payment.Id, LogAction.Update, payment.SavingPeriodId, oldAmount, payment.Amount),
                ct);
        }, cancellationToken);

        return ToResponse(payment, member, period.Year);
    }

    public async Task CancelAsync(Guid paymentId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var payment = await paymentRepository.GetByIdAsync(paymentId, period.Id, cancellationToken)
            ?? throw new DomainException("Monthly payment not found.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            payment.Cancel();
            if (payment.Transaction is { IsCancelled: false } transaction)
                transaction.Cancel();

            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.MonthlyPayment, payment.Id, LogAction.Delete, payment.SavingPeriodId, payment.Amount, null),
                ct);
        }, cancellationToken);
    }

    private static PaymentStatus GetRequestedStatus(PaymentStatus? requested)
    {
        if (requested is not { } status || status == PaymentStatus.Cancelled || !Enum.IsDefined(status))
            throw new DomainException("Monthly payment status must be Pending or Paid.");

        return status;
    }

    private static string Description(MonthlyPayment payment, User member, int year) =>
        $"Monthly payment - {payment.Month:00}/{year} - {member.FirstName} {member.LastName}";

    private static Transaction NewTransaction(MonthlyPayment payment, User member, int year) =>
        new(payment.Amount, TransactionDirection.Income, TransactionType.MonthlyPayment, Description(payment, member, year),
            payment.SavingPeriodId);

    private static MonthlyPaymentResponse ToResponse(MonthlyPayment payment, User member, int year) =>
        new(payment.Id, payment.UserId, payment.TransactionId, payment.Amount, year, payment.Month,
            payment.PaidAt, payment.Status, member.FirstName + " " + member.LastName);
}
