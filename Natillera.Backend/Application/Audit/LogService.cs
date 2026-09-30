namespace Natillera.Backend.Application.Audit;

public sealed class LogService(ILogRepository logRepository)
{
    public Task<IReadOnlyCollection<LogListItem>> GetAllAsync(CancellationToken cancellationToken) =>
        logRepository.GetAllAsync(cancellationToken);

    public Task<LogDetailResponse?> GetDetailAsync(Guid id, CancellationToken cancellationToken) =>
        logRepository.GetDetailAsync(id, cancellationToken);
}
