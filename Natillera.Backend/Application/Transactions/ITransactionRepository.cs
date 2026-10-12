using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Transactions;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(CancellationToken cancellationToken = default);
    Task<TransactionDetailResponse?> GetDetailAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>DASH-01: SUM(Income) - SUM(Expense) over non-cancelled transactions.</summary>
    Task<decimal> GetAvailableMoneyAsync(CancellationToken cancellationToken = default);
}
