using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(NatilleraDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        dbContext.Users.SingleOrDefaultAsync(user => user.Email == email, cancellationToken);

    public Task<List<User>> GetMembersAsync(CancellationToken cancellationToken = default) =>
        dbContext.Users.Where(user => user.Role == Domain.Enums.UserRole.Member).OrderBy(user => user.LastName).ThenBy(user => user.FirstName).ToListAsync(cancellationToken);

    public Task<User?> GetMemberByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Users.SingleOrDefaultAsync(user => user.Id == id && user.Role == Domain.Enums.UserRole.Member, cancellationToken);

    public Task<bool> EmailExistsAsync(string email, Guid? excludedUserId = null, CancellationToken cancellationToken = default) =>
        dbContext.Users.AnyAsync(user => user.Email == email && (!excludedUserId.HasValue || user.Id != excludedUserId.Value), cancellationToken);

    public Task<bool> IsActiveUserAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Users.AnyAsync(user => user.Id == id && user.IsActive, cancellationToken);

    public async Task<MemberPendingObligations> GetPendingObligationsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var pendingMonthlyPayments = await dbContext.MonthlyPayments
            .CountAsync(payment => payment.UserId == userId && payment.Status == Domain.Enums.PaymentStatus.Pending, cancellationToken);
        var activeLoans = await dbContext.Loans
            .CountAsync(loan => loan.BorrowerId == userId && loan.Status == Domain.Enums.LoanStatus.Active, cancellationToken);
        var pendingInterestPayments = await dbContext.Performances
            .CountAsync(performance => performance.Loan.BorrowerId == userId && performance.Status == Domain.Enums.PaymentStatus.Pending, cancellationToken);
        var pendingActivityAssignments = await dbContext.ActivityAssignments
            .CountAsync(assignment => assignment.UserId == userId && assignment.Status == Domain.Enums.AssignmentStatus.Pending, cancellationToken);

        return new MemberPendingObligations(pendingMonthlyPayments, activeLoans, pendingInterestPayments, pendingActivityAssignments);
    }

    public Task AddAsync(User user, CancellationToken cancellationToken = default) =>
        dbContext.Users.AddAsync(user, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
