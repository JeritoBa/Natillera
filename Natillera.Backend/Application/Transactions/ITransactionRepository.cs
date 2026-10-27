using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Transactions;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    /// <summary>TX-03: one page of one period, newest first, filtered on the server.</summary>
    Task<TransactionPageResponse> GetPageAsync(Guid savingPeriodId, TransactionListFilter filter, CancellationToken cancellationToken = default);
    Task<TransactionDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);

    /// <summary>DASH-01 / PER-06: SUM(Income) - SUM(Expense) over the non-cancelled transactions of one period.</summary>
    Task<decimal> GetAvailableMoneyAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);

    /// <summary>DASH-12 / FIN-14: RAW shared interest pool = paid interest - paid extra costs of one period (not clamped; see <see cref="InterestPool"/>).</summary>
    Task<decimal> GetSharedInterestPoolAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
}
