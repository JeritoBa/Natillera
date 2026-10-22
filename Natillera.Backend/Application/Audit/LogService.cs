using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Audit;

public sealed class LogService(ILogRepository logRepository)
{
    public Task<IReadOnlyCollection<LogListItem>> GetAllAsync(SavingPeriod period, CancellationToken cancellationToken) =>
        logRepository.GetAllAsync(period.Id, cancellationToken);

    public Task<LogDetailResponse?> GetDetailAsync(Guid id, SavingPeriod period, CancellationToken cancellationToken) =>
        logRepository.GetDetailAsync(id, period.Id, cancellationToken);
}
