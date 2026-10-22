using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.MonthlyPayments;

public interface IMonthlyPaymentRepository
{
    Task<bool> ExistsAsync(Guid userId, Guid savingPeriodId, int month, CancellationToken cancellationToken = default);
    Task<MonthlyPayment?> GetByIdAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<bool> ExistsForAnotherPaymentAsync(Guid userId, Guid savingPeriodId, int month, Guid paymentId, CancellationToken cancellationToken = default);
    Task AddAsync(MonthlyPayment payment, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<MonthlyPaymentListItem>> GetOrderedAsync(bool includeNonPaid, Guid savingPeriodId, CancellationToken cancellationToken = default);
}
