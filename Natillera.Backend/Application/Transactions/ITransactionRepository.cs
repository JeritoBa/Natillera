using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Transactions;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<TransactionDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);

    /// <summary>DASH-01 / PER-06: SUM(Income) - SUM(Expense) over the non-cancelled transactions of one period.</summary>
    Task<decimal> GetAvailableMoneyAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
}
