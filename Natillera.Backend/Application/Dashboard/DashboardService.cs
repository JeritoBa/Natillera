namespace Natillera.Backend.Application.Dashboard;

public sealed class DashboardService(IDashboardRepository dashboardRepository)
{
    public Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, CancellationToken cancellationToken) =>
        dashboardRepository.GetSummaryAsync(userId, role, cancellationToken);
}
