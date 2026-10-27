using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Audit;

public interface ILogRepository
{
    Task AddAsync(Log log, CancellationToken cancellationToken = default);
    /// <summary>AUD-04: one page of one period, newest first, filtered on the server.</summary>
    Task<PagedResult<LogListItem>> GetPageAsync(Guid savingPeriodId, LogListFilter filter, CancellationToken cancellationToken = default);
    Task<LogDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
}
