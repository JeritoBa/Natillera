namespace Natillera.Backend.Application.Users;

public interface IPendingObligationsRepository
{
    Task<PendingObligationsData> GetDataAsync(Guid memberId, Guid savingPeriodId, CancellationToken cancellationToken = default);

    // DASH-14: raw rows for every member of the period in one set of queries (no N+1); MEM-10 stays in PendingObligationsCalculator.
    Task<IReadOnlyCollection<MemberPendingObligationsData>> GetForAllMembersAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
}
