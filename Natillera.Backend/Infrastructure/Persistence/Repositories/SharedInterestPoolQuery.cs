using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

/// <summary>DASH-12: the single definition of the raw shared interest pool, used by every repository that needs it.</summary>
internal static class SharedInterestPoolQuery
{
    public static async Task<decimal> RawAsync(NatilleraDbContext dbContext, Guid savingPeriodId, CancellationToken cancellationToken)
    {
        var interest = await PaidTotalAsync(dbContext, savingPeriodId, TransactionType.Performance, cancellationToken);
        var extraCosts = await PaidTotalAsync(dbContext, savingPeriodId, TransactionType.ExtraCost, cancellationToken);
        return interest - extraCosts;
    }

    public static async Task<decimal> PaidTotalAsync(NatilleraDbContext dbContext, Guid savingPeriodId, TransactionType type, CancellationToken cancellationToken) =>
        await dbContext.Transactions
            .Where(transaction => transaction.SavingPeriodId == savingPeriodId && !transaction.IsCancelled && transaction.Type == type)
            .Select(transaction => (decimal?)transaction.Amount)
            .SumAsync(cancellationToken) ?? 0m;
}
