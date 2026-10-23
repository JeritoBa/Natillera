using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Transactions;

public sealed class TransactionService(ITransactionRepository transactionRepository)
{
    public Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(SavingPeriod period, CancellationToken cancellationToken) =>
        transactionRepository.GetOrderedAsync(period.Id, cancellationToken);

    public Task<TransactionDetailResponse?> GetDetailAsync(Guid id, SavingPeriod period, CancellationToken cancellationToken) => transactionRepository.GetDetailAsync(id, period.Id, cancellationToken);
}
