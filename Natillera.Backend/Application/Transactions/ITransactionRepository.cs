using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Transactions;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(CancellationToken cancellationToken = default);
}
