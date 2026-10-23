using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Audit;

public interface ILogRepository
{
    Task AddAsync(Log log, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LogListItem>> GetAllAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<LogDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
}
