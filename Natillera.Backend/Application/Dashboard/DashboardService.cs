using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Dashboard;

public sealed class DashboardService(
    IDashboardRepository dashboardRepository,
    IPendingObligationsRepository pendingObligationsRepository)
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, SavingPeriod period, CancellationToken cancellationToken)
    {
        var summary = await dashboardRepository.GetSummaryAsync(userId, role, period.Id, cancellationToken);
        if (string.Equals(role, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
            return summary with { MembersPendingObligations = await GetMembersPendingAsync(period.Id, cancellationToken) };

        if (!string.Equals(role, nameof(UserRole.Member), StringComparison.OrdinalIgnoreCase)) return summary;

        // DASH-11: the member sees everything they still owe (MEM-10). The admin summary is unchanged.
        var pending = PendingObligationsCalculator.Calculate(
            await pendingObligationsRepository.GetDataAsync(userId, period.Id, cancellationToken));
        return summary with { PendingObligations = pending };
    }

    // DASH-14: MEM-10 applied to every member with the same calculator as the member detail; only total > 0.
    private async Task<IReadOnlyCollection<MemberPendingObligationsItem>> GetMembersPendingAsync(Guid periodId, CancellationToken cancellationToken)
    {
        var members = await pendingObligationsRepository.GetForAllMembersAsync(periodId, cancellationToken);
        return members
            .Select(member => (Member: member, Pending: PendingObligationsCalculator.Calculate(member.Data)))
            .Where(x => x.Pending.Total > 0m)
            .Select(x => new MemberPendingObligationsItem(x.Member.UserId, x.Member.MemberName, x.Member.IsActive, x.Pending.Total,
                new PendingKindTotal(x.Pending.MonthlyPayments.Count, x.Pending.MonthlyPayments.Amount),
                new PendingKindTotal(x.Pending.Loans.Count, x.Pending.Loans.Amount),
                new PendingKindTotal(x.Pending.Interests.Count, x.Pending.Interests.Amount),
                new PendingKindTotal(x.Pending.ActivitySales.Count, x.Pending.ActivitySales.Amount)))
            .OrderByDescending(item => item.Total)
            .ThenBy(item => item.MemberName, StringComparer.CurrentCultureIgnoreCase)
            .ToList();
    }
}
