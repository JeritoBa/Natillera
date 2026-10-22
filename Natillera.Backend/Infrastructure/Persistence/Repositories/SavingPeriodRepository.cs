using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.SavingPeriods;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class SavingPeriodRepository(NatilleraDbContext dbContext) : ISavingPeriodRepository
{
    public Task<SavingPeriod?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.SavingPeriods.AsNoTracking().SingleOrDefaultAsync(period => period.Id == id, cancellationToken);

    public async Task<IReadOnlyCollection<SavingPeriod>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await dbContext.SavingPeriods.AsNoTracking().OrderByDescending(period => period.Year).ToListAsync(cancellationToken);
}
