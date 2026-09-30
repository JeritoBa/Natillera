namespace Natillera.Backend.Application.Dashboard;

public interface IDashboardRepository
{
    Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, CancellationToken cancellationToken = default);
}
