using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Activities;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class ActivityRepository(NatilleraDbContext dbContext) : IActivityRepository
{
    public async Task<IReadOnlyCollection<ActivityListData>> GetListAsync(Guid savingPeriodId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Activities.AsNoTracking()
            .Where(activity => activity.SavingPeriodId == savingPeriodId)
            .OrderByDescending(activity => activity.StartDate)
            .ThenByDescending(activity => activity.CreatedAt)
            .Select(activity => new ActivityListData(
                activity.Id,
                activity.Name,
                activity.Description,
                activity.Quantity,
                activity.UnitCost,
                activity.UnitSalePrice,
                activity.StartDate,
                activity.Status,
                dbContext.ActivityAssignments
                    .Where(assignment => assignment.ActivityId == activity.Id && assignment.Status != AssignmentStatus.Cancelled)
                    .Select(assignment => (int?)assignment.QuantityAssigned).Sum() ?? 0))
            .ToArrayAsync(cancellationToken);
    }

    public Task<Activity?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        dbContext.Activities.AsNoTracking()
            .Include(activity => activity.Assignments).ThenInclude(assignment => assignment.User)
            .Include(activity => activity.ExtraCosts)
            .SingleOrDefaultAsync(activity => activity.Id == id && activity.SavingPeriodId == savingPeriodId, cancellationToken);

    public Task<Activity?> GetForUpdateAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        dbContext.Activities
            .Include(activity => activity.Transaction)
            .Include(activity => activity.Assignments).ThenInclude(assignment => assignment.Transaction)
            .Include(activity => activity.Assignments).ThenInclude(assignment => assignment.User)
            .Include(activity => activity.ExtraCosts).ThenInclude(extraCost => extraCost.Transaction)
            .SingleOrDefaultAsync(activity => activity.Id == id && activity.SavingPeriodId == savingPeriodId, cancellationToken);

    public Task AddAsync(Activity activity, CancellationToken cancellationToken = default) =>
        dbContext.Activities.AddAsync(activity, cancellationToken).AsTask();

    public Task AddAssignmentAsync(ActivityAssignment assignment, CancellationToken cancellationToken = default) =>
        dbContext.ActivityAssignments.AddAsync(assignment, cancellationToken).AsTask();

    public Task AddExtraCostAsync(ExtraCost extraCost, CancellationToken cancellationToken = default) =>
        dbContext.ExtraCosts.AddAsync(extraCost, cancellationToken).AsTask();
}
