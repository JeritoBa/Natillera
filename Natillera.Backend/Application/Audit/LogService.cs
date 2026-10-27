using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Audit;

public sealed class LogService(ILogRepository logRepository)
{
    public Task<PagedResult<LogListItem>> GetPageAsync(SavingPeriod period, LogListFilter filter, CancellationToken cancellationToken) =>
        logRepository.GetPageAsync(period.Id, filter, cancellationToken);

    public Task<LogDetailResponse?> GetDetailAsync(Guid id, SavingPeriod period, CancellationToken cancellationToken) =>
        logRepository.GetDetailAsync(id, period.Id, cancellationToken);
}
