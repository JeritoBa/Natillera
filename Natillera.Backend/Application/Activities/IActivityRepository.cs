using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Activities;

public interface IActivityRepository
{
    Task<IReadOnlyCollection<ActivityListData>> GetListAsync(CancellationToken cancellationToken = default);
    Task<Activity?> GetDetailAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Activity?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Activity activity, CancellationToken cancellationToken = default);
    Task AddAssignmentAsync(ActivityAssignment assignment, CancellationToken cancellationToken = default);
}
