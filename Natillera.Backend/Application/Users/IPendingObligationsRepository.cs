namespace Natillera.Backend.Application.Users;

public interface IPendingObligationsRepository
{
    Task<PendingObligationsData> GetDataAsync(Guid memberId, CancellationToken cancellationToken = default);
}
