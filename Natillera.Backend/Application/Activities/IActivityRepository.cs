using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Activities;

public interface IActivityRepository
{
    Task<IReadOnlyCollection<ActivityListData>> GetListAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<Activity?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<Activity?> GetForUpdateAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task AddAsync(Activity activity, CancellationToken cancellationToken = default);
    Task AddAssignmentAsync(ActivityAssignment assignment, CancellationToken cancellationToken = default);
    Task AddExtraCostAsync(ExtraCost extraCost, CancellationToken cancellationToken = default);
}
