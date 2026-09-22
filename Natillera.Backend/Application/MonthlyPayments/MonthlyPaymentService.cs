using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Common;
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
    IUnitOfWork unitOfWork,
    MonthlyPaymentOptions options)
{
    public Task<IReadOnlyCollection<MonthlyPaymentListItem>> GetPaidOrderedAsync(CancellationToken cancellationToken) =>
        paymentRepository.GetPaidOrderedAsync(cancellationToken);

    public async Task<MonthlyPaymentResponse> CreateAsync(
        CreateMonthlyPaymentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Amount < options.MinimumAmount)
            throw new DomainException($"Monthly payment must be at least {options.MinimumAmount:0.00}.");

        var member = await memberReader.GetMemberByIdAsync(request.UserId, cancellationToken)
            ?? throw new DomainException("Member not found.");

        if (!member.IsActive)
            throw new DomainException("Only active members can receive a monthly payment.");

        if (await paymentRepository.ExistsAsync(request.UserId, request.Year, request.Month, cancellationToken))
            throw new DomainException("A monthly payment already exists for this member and period.");

        var description = $"Monthly payment - {request.Month:00}/{request.Year} - {member.FirstName} {member.LastName}";
        var transaction = new Transaction(
            request.Amount,
            TransactionDirection.Income,
            TransactionType.MonthlyPayment,
            description);
        var payment = new MonthlyPayment(
            request.Amount,
            request.Year,
            request.Month,
            request.UserId,
            transaction.Id);

        try
        {
            await unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                await transactionRepository.AddAsync(transaction, ct);
                await paymentRepository.AddAsync(payment, ct);
            }, cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is not null)
        {
            throw new DomainException("A monthly payment already exists for this member and period.");
        }

        return new MonthlyPaymentResponse(
            payment.Id,
            payment.UserId,
            payment.TransactionId,
            payment.Amount,
            payment.Year,
            payment.Month,
            payment.PaidAt,
            payment.Status,
            member.FirstName + " " + member.LastName);
    }

    public async Task<MonthlyPaymentResponse> UpdateAsync(Guid paymentId, UpdateMonthlyPaymentRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount < options.MinimumAmount)
            throw new DomainException($"Monthly payment must be at least {options.MinimumAmount:0.00}.");

        var payment = await paymentRepository.GetByIdAsync(paymentId, cancellationToken)
            ?? throw new DomainException("Monthly payment not found.");
        var member = await memberReader.GetMemberByIdAsync(request.UserId, cancellationToken)
            ?? throw new DomainException("Member not found.");

        if (!member.IsActive)
            throw new DomainException("Only active members can receive a monthly payment.");
        if (await paymentRepository.ExistsForAnotherPaymentAsync(request.UserId, request.Year, request.Month, paymentId, cancellationToken))
            throw new DomainException("A monthly payment already exists for this member and period.");

        var description = $"Monthly payment - {request.Month:00}/{request.Year} - {member.FirstName} {member.LastName}";
        payment.UpdateDetails(request.Amount, request.Year, request.Month, request.UserId);
        payment.Transaction.Update(request.Amount, TransactionDirection.Income, TransactionType.MonthlyPayment, description);

        await unitOfWork.ExecuteInTransactionAsync(_ => Task.CompletedTask, cancellationToken);

        return new MonthlyPaymentResponse(payment.Id, payment.UserId, payment.TransactionId, payment.Amount, payment.Year, payment.Month, payment.PaidAt, payment.Status, member.FirstName + " " + member.LastName);
    }
}
