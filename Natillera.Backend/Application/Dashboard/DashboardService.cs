using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Dashboard;

public sealed class DashboardService(
    IDashboardRepository dashboardRepository,
    IPendingObligationsRepository pendingObligationsRepository)
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, CancellationToken cancellationToken)
    {
        var summary = await dashboardRepository.GetSummaryAsync(userId, role, cancellationToken);
        if (!string.Equals(role, nameof(UserRole.Member), StringComparison.OrdinalIgnoreCase)) return summary;

        // DASH-11: the member sees everything they still owe (MEM-10). The admin summary is unchanged.
        var pending = PendingObligationsCalculator.Calculate(
            await pendingObligationsRepository.GetDataAsync(userId, cancellationToken));
        return summary with { PendingObligations = pending };
    }
}
