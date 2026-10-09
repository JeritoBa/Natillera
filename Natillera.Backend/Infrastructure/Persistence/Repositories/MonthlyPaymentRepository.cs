using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class MonthlyPaymentRepository(NatilleraDbContext dbContext) : IMonthlyPaymentRepository
{
    public Task<bool> ExistsAsync(Guid userId, int year, int month, CancellationToken cancellationToken = default) =>
        dbContext.MonthlyPayments.AnyAsync(payment =>
            payment.UserId == userId && payment.Year == year && payment.Month == month
            && payment.Status != Domain.Enums.PaymentStatus.Cancelled,
            cancellationToken);

    public Task<MonthlyPayment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.MonthlyPayments.Include(payment => payment.Transaction)
            .SingleOrDefaultAsync(payment => payment.Id == id, cancellationToken);

    public Task<bool> ExistsForAnotherPaymentAsync(Guid userId, int year, int month, Guid paymentId, CancellationToken cancellationToken = default) =>
        dbContext.MonthlyPayments.AnyAsync(payment => payment.UserId == userId && payment.Year == year && payment.Month == month && payment.Id != paymentId
            && payment.Status != Domain.Enums.PaymentStatus.Cancelled, cancellationToken);

    public Task AddAsync(MonthlyPayment payment, CancellationToken cancellationToken = default) =>
        dbContext.MonthlyPayments.AddAsync(payment, cancellationToken).AsTask();

    public async Task<IReadOnlyCollection<MonthlyPaymentListItem>> GetOrderedAsync(bool includeNonPaid, CancellationToken cancellationToken = default)
    {
        return await dbContext.MonthlyPayments
            .Where(payment => includeNonPaid || payment.Status == Domain.Enums.PaymentStatus.Paid)
            .OrderByDescending(payment => payment.PaidAt ?? payment.CreatedAt)
            .Select(payment => new MonthlyPaymentListItem(
                payment.Id,
                payment.UserId,
                payment.TransactionId,
                payment.Amount,
                payment.Year,
                payment.Month,
                payment.PaidAt,
                payment.Status,
                payment.User.FirstName + " " + payment.User.LastName))
            .ToArrayAsync(cancellationToken);
    }
}
