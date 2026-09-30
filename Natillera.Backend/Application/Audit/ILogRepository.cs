using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Audit;

public interface ILogRepository
{
    Task AddAsync(Log log, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LogListItem>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LogDetailResponse?> GetDetailAsync(Guid id, CancellationToken cancellationToken = default);
}
