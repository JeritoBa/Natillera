using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Users;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<List<User>> GetMembersAsync(CancellationToken cancellationToken = default);
    Task<User?> GetMemberByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, Guid? excludedUserId = null, CancellationToken cancellationToken = default);
    Task<bool> IsActiveUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<MemberPendingObligations> GetPendingObligationsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed record MemberPendingObligations(int PendingMonthlyPayments, int ActiveLoans, int PendingInterestPayments, int PendingActivityAssignments)
{
    public bool HasAny => PendingMonthlyPayments + ActiveLoans + PendingInterestPayments + PendingActivityAssignments > 0;
}
