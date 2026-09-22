using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.MonthlyPayments;

public interface IMonthlyPaymentRepository
{
    Task<bool> ExistsAsync(Guid userId, int year, int month, CancellationToken cancellationToken = default);
    Task<MonthlyPayment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsForAnotherPaymentAsync(Guid userId, int year, int month, Guid paymentId, CancellationToken cancellationToken = default);
    Task AddAsync(MonthlyPayment payment, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<MonthlyPaymentListItem>> GetPaidOrderedAsync(CancellationToken cancellationToken = default);
}
