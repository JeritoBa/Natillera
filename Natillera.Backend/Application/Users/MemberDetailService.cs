using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Users;

public sealed class MemberDetailService(IMemberDetailRepository repository, IPendingObligationsRepository pendingObligationsRepository)
{
    public async Task<MemberDetailResponse?> GetDetailAsync(Guid memberId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var data = await repository.GetDetailAsync(memberId, period.Id, cancellationToken);
        if (data is null) return null;

        // DASH-06 / DASH-12: equal share of the shared interest pool (paid interest minus paid extra costs).
        var performanceEarnings = InterestPool.Share(data.SharedInterestPool, data.ActiveMembersCount);

        var balance = new MemberBalanceResponse(
            data.Savings,
            data.ActivityEarnings,
            performanceEarnings,
            data.Savings + data.ActivityEarnings + performanceEarnings);

        var pending = PendingObligationsCalculator.Calculate(
            await pendingObligationsRepository.GetDataAsync(memberId, period.Id, cancellationToken));

        return new MemberDetailResponse(data.Member, balance, data.PendingPayments, data.Transactions, pending);
    }
}
