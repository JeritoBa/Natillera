using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class MemberDetailRepository(NatilleraDbContext dbContext) : IMemberDetailRepository
{
    public async Task<MemberDetailData?> GetDetailAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var member = await dbContext.Users.AsNoTracking()
            .Where(user => user.Id == memberId && user.Role == UserRole.Member)
            .Select(user => new MemberInfoResponse(user.Id, user.FirstName, user.LastName, user.Email, user.Phone,
                user.Role, user.IsActive, user.CreatedAt, user.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
        if (member is null) return null;

        var savings = await dbContext.MonthlyPayments.AsNoTracking()
            .Where(payment => payment.UserId == memberId && payment.Status == PaymentStatus.Paid)
            .Select(payment => (decimal?)payment.Amount)
            .SumAsync(cancellationToken) ?? 0m;

        var activityEarnings = await dbContext.ActivityAssignments.AsNoTracking()
            .Where(assignment => assignment.UserId == memberId && assignment.Status != AssignmentStatus.Cancelled)
            .Select(assignment => (decimal?)(assignment.QuantityAssigned * (assignment.Activity.UnitSalePrice - assignment.Activity.UnitCost)))
            .SumAsync(cancellationToken) ?? 0m;

        var paidPerformancesTotal = await dbContext.Performances.AsNoTracking()
            .Where(performance => performance.Status == PaymentStatus.Paid)
            .Select(performance => (decimal?)performance.Amount)
            .SumAsync(cancellationToken) ?? 0m;

        var activeMembersCount = await dbContext.Users.AsNoTracking()
            .CountAsync(user => user.IsActive && user.Role == UserRole.Member, cancellationToken);

        var pendingPayments = await dbContext.MonthlyPayments.AsNoTracking()
            .Where(payment => payment.UserId == memberId && payment.Status == PaymentStatus.Pending)
            .OrderBy(payment => payment.Year).ThenBy(payment => payment.Month).ThenBy(payment => payment.CreatedAt)
            .Select(payment => new MemberPendingPaymentResponse(payment.Id, payment.Year, payment.Month, payment.Amount,
                payment.Status, payment.CreatedAt, payment.TransactionId))
            .ToArrayAsync(cancellationToken);

        // Same linkage criteria as DashboardRepository.GetMemberSummaryAsync.
        var userTransactionIds = dbContext.MonthlyPayments.Where(payment => payment.UserId == memberId).Select(payment => payment.TransactionId)
            .Union(dbContext.Loans.Where(loan => loan.BorrowerId == memberId).Select(loan => loan.TransactionId))
            .Union(dbContext.LoanPayments.Where(payment => payment.Loan.BorrowerId == memberId).Select(payment => payment.TransactionId))
            .Union(dbContext.Performances.Where(performance => performance.Loan.BorrowerId == memberId).Select(performance => performance.TransactionId))
            .Union(dbContext.ActivityAssignments.Where(assignment => assignment.UserId == memberId).Select(assignment => assignment.TransactionId));

        var transactions = await dbContext.Transactions.AsNoTracking()
            .Where(transaction => userTransactionIds.Contains(transaction.Id))
            .OrderBy(transaction => transaction.OccurredAt)
            .Select(transaction => new MemberTransactionResponse(transaction.Id, transaction.Amount, transaction.Direction,
                transaction.Type, transaction.OccurredAt, transaction.Description))
            .ToArrayAsync(cancellationToken);

        return new MemberDetailData(member, savings, activityEarnings, paidPerformancesTotal, activeMembersCount,
            pendingPayments, transactions);
    }
}
