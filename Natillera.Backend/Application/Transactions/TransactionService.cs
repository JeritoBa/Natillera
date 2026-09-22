namespace Natillera.Backend.Application.Transactions;

public sealed class TransactionService(ITransactionRepository transactionRepository)
{
    public Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(CancellationToken cancellationToken) =>
        transactionRepository.GetOrderedAsync(cancellationToken);
}
