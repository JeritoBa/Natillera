using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.SavingPeriods;

public interface ISavingPeriodRepository
{
    Task<SavingPeriod?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>All periods, newest year first.</summary>
    Task<IReadOnlyCollection<SavingPeriod>> GetAllAsync(CancellationToken cancellationToken = default);
}
