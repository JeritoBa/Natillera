using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Transactions;

public sealed class TransactionService(ITransactionRepository transactionRepository)
{
    public Task<TransactionPageResponse> GetPageAsync(SavingPeriod period, TransactionListFilter filter, CancellationToken cancellationToken) =>
        transactionRepository.GetPageAsync(period.Id, filter, cancellationToken);

    public Task<TransactionDetailResponse?> GetDetailAsync(Guid id, SavingPeriod period, CancellationToken cancellationToken) => transactionRepository.GetDetailAsync(id, period.Id, cancellationToken);
}
