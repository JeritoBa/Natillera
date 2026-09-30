namespace Natillera.Backend.Application.Users;

public interface IMemberDetailRepository
{
    /// <summary>Returns null when the user does not exist or is not a Member.</summary>
    Task<MemberDetailData?> GetDetailAsync(Guid memberId, CancellationToken cancellationToken = default);
}
