namespace Natillera.Backend.Application.Users;

public sealed class MemberDetailService(IMemberDetailRepository repository)
{
    public async Task<MemberDetailResponse?> GetDetailAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var data = await repository.GetDetailAsync(memberId, cancellationToken);
        if (data is null) return null;

        // Equal share of all paid performances among active members. Rounded to 2 decimals,
        // half away from zero (conventional money rounding); 0 when there are no active members.
        var performanceEarnings = data.ActiveMembersCount == 0
            ? 0m
            : Math.Round(data.PaidPerformancesTotal / data.ActiveMembersCount, 2, MidpointRounding.AwayFromZero);

        var balance = new MemberBalanceResponse(
            data.Savings,
            data.ActivityEarnings,
            performanceEarnings,
            data.Savings + data.ActivityEarnings + performanceEarnings);

        return new MemberDetailResponse(data.Member, balance, data.PendingPayments, data.Transactions);
    }
}
