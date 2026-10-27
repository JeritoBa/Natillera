using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Dashboard;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class DashboardRepository(NatilleraDbContext dbContext) : IDashboardRepository
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, Guid savingPeriodId, CancellationToken cancellationToken = default)
    {
        var availableMoney = await dbContext.Transactions
            .Where(transaction => transaction.SavingPeriodId == savingPeriodId && !transaction.IsCancelled)
            .Select(transaction => transaction.Direction == TransactionDirection.Income ? transaction.Amount : -transaction.Amount)
            .SumAsync(cancellationToken);

        if (string.Equals(role, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
            return await GetAdminSummaryAsync(availableMoney, savingPeriodId, cancellationToken);

        return await GetMemberSummaryAsync(userId, availableMoney, savingPeriodId, cancellationToken);
    }

    private async Task<DashboardSummaryResponse> GetAdminSummaryAsync(decimal availableMoney, Guid savingPeriodId, CancellationToken cancellationToken)
    {
        var lentMoney = await dbContext.Loans
            .Where(loan => loan.SavingPeriodId == savingPeriodId && loan.Status == LoanStatus.Active)
            .Select(loan => loan.InitialAmount - (dbContext.LoanPayments
                .Where(payment => payment.LoanId == loan.Id && payment.Status != PaymentStatus.Cancelled)
                .Select(payment => (decimal?)payment.Amount).Sum() ?? 0m))
            .SumAsync(cancellationToken);

        var pendingActivitiesInvestment = await dbContext.ActivityAssignments
            .Where(assignment => assignment.Activity.SavingPeriodId == savingPeriodId && assignment.Status == AssignmentStatus.Pending)
            .Select(assignment => assignment.QuantityAssigned * assignment.Activity.UnitCost)
            .SumAsync(cancellationToken);

        // DASH-12: gross paid interest stays as is; the net pool and the paid extra costs are reported next to it.
        var loanInterestEarned = await SharedInterestPoolQuery.PaidTotalAsync(dbContext, savingPeriodId, TransactionType.Performance, cancellationToken);
        var paidExtraCosts = await SharedInterestPoolQuery.PaidTotalAsync(dbContext, savingPeriodId, TransactionType.ExtraCost, cancellationToken);

        // DASH-13: Paid fees of the period (registered money only).
        var paidMonthlyPayments = await dbContext.MonthlyPayments
            .Where(payment => payment.SavingPeriodId == savingPeriodId && payment.Status == PaymentStatus.Paid)
            .Select(payment => (decimal?)payment.Amount)
            .SumAsync(cancellationToken) ?? 0m;

        // DASH-03 (spec 029): earned so far = margin qty x (price - cost) of the Paid assignments of non-cancelled activities.
        // Never negative (price >= cost, ACT-01); nothing is subtracted (extra costs reduce only the interest pool, ACT-15).
        var activityEarnings = await PaidAssignments(savingPeriodId)
            .Select(assignment => (decimal?)(assignment.QuantityAssigned * (assignment.Activity.UnitSalePrice - assignment.Activity.UnitCost)))
            .SumAsync(cancellationToken) ?? 0m;

        var recentTransactions = await GetRecentTransactionsAsync(savingPeriodId, cancellationToken);
        var topSellers = await GetTopSellersAsync(savingPeriodId, cancellationToken);
        return new DashboardSummaryResponse(
            nameof(UserRole.Admin),
            availableMoney,
            availableMoney + lentMoney + pendingActivitiesInvestment,
            lentMoney,
            pendingActivitiesInvestment,
            null,
            null,
            null,
            recentTransactions,
            topSellers,
            null,
            loanInterestEarned,
            activityEarnings,
            null,
            null,
            null,
            InterestPool.Net(loanInterestEarned - paidExtraCosts),
            paidExtraCosts,
            PaidMonthlyPayments: paidMonthlyPayments);
    }

    private async Task<DashboardSummaryResponse> GetMemberSummaryAsync(Guid userId, decimal availableMoney, Guid savingPeriodId, CancellationToken cancellationToken)
    {
        // Same definition as MemberDetailRepository/MemberDetailService (member balance.total).
        var paidMonthlyPayments = await dbContext.MonthlyPayments
            .Where(payment => payment.SavingPeriodId == savingPeriodId && payment.UserId == userId && payment.Status == PaymentStatus.Paid)
            .Select(payment => (decimal?)payment.Amount)
            .SumAsync(cancellationToken) ?? 0m;

        var activityEarnings = await dbContext.ActivityAssignments
            .Where(assignment => assignment.Activity.SavingPeriodId == savingPeriodId && assignment.UserId == userId && assignment.Status != AssignmentStatus.Cancelled)
            .Select(assignment => (decimal?)(assignment.QuantityAssigned * (assignment.Activity.UnitSalePrice - assignment.Activity.UnitCost)))
            .SumAsync(cancellationToken) ?? 0m;

        var sharedInterestPool = InterestPool.Net(await SharedInterestPoolQuery.RawAsync(dbContext, savingPeriodId, cancellationToken)); // DASH-12

        // PER-07: members have no period, the interest share is divided among those active today.
        var activeMembersCount = await dbContext.Users
            .CountAsync(user => user.IsActive && user.Role == UserRole.Member, cancellationToken);

        var performanceShare = InterestPool.Share(sharedInterestPool, activeMembersCount);

        var mySavings = paidMonthlyPayments + activityEarnings + performanceShare;
        var myEarnings = activityEarnings + performanceShare;

        var pendingPayments = await dbContext.MonthlyPayments
            .CountAsync(payment => payment.SavingPeriodId == savingPeriodId && payment.UserId == userId && payment.Status == PaymentStatus.Pending, cancellationToken);

        var recentTransactions = await GetRecentTransactionsAsync(savingPeriodId, cancellationToken);
        var topSellers = await GetTopSellersAsync(savingPeriodId, cancellationToken);
        return new DashboardSummaryResponse(
            nameof(UserRole.Member),
            availableMoney,
            null,
            null,
            null,
            mySavings,
            myEarnings,
            pendingPayments,
            recentTransactions,
            topSellers,
            paidMonthlyPayments,
            null,
            null,
            activityEarnings,
            performanceShare);
    }

    private IQueryable<Domain.Entities.ActivityAssignment> PaidAssignments(Guid savingPeriodId) =>
        dbContext.ActivityAssignments.Where(assignment =>
            assignment.Activity.SavingPeriodId == savingPeriodId && assignment.Status == AssignmentStatus.Paid && assignment.Activity.Status != ActivityStatus.Cancelled);

    private async Task<TopSellerItem[]> GetTopSellersAsync(Guid savingPeriodId, CancellationToken cancellationToken)
    {
        var totals = await PaidAssignments(savingPeriodId)
            .GroupBy(assignment => assignment.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                UnitsSold = group.Sum(assignment => assignment.QuantityAssigned),
                Collected = group.Sum(assignment => assignment.QuantityAssigned * assignment.Activity.UnitSalePrice),
                Earnings = group.Sum(assignment => assignment.QuantityAssigned * (assignment.Activity.UnitSalePrice - assignment.Activity.UnitCost))
            })
            .Where(total => total.Earnings != 0m || total.Collected != 0m)
            .ToListAsync(cancellationToken);

        var userIds = totals.Select(total => total.UserId).ToList();
        var names = await dbContext.Users
            .Where(user => userIds.Contains(user.Id))
            .Select(user => new { user.Id, Name = user.FirstName + " " + user.LastName })
            .ToDictionaryAsync(user => user.Id, user => user.Name, cancellationToken);

        return totals
            .Select(total => new TopSellerItem(total.UserId, names.GetValueOrDefault(total.UserId, string.Empty), total.UnitsSold, total.Collected, total.Earnings))
            .OrderByDescending(item => item.Earnings)
            .ThenByDescending(item => item.CollectedAmount)
            .ThenBy(item => item.MemberName, StringComparer.CurrentCultureIgnoreCase)
            .Take(10)
            .ToArray();
    }

    private Task<DashboardTransactionResponse[]> GetRecentTransactionsAsync(Guid savingPeriodId, CancellationToken cancellationToken)
    {
        var query = dbContext.Transactions.Where(transaction => transaction.SavingPeriodId == savingPeriodId && !transaction.IsCancelled);

        return query.OrderByDescending(transaction => transaction.OccurredAt).Take(10)
            .Select(transaction => new DashboardTransactionResponse(
                transaction.Id, transaction.Amount, transaction.Direction, transaction.Type, transaction.OccurredAt,
                transaction.Description,
                dbContext.MonthlyPayments.Where(payment => payment.TransactionId == transaction.Id)
                    .Select(payment => payment.User.FirstName + " " + payment.User.LastName).FirstOrDefault()
                ?? dbContext.Loans.Where(loan => loan.TransactionId == transaction.Id)
                    .Select(loan => loan.Borrower.FirstName + " " + loan.Borrower.LastName).FirstOrDefault()
                ?? dbContext.LoanPayments.Where(payment => payment.TransactionId == transaction.Id)
                    .Select(payment => payment.Loan.Borrower.FirstName + " " + payment.Loan.Borrower.LastName).FirstOrDefault()
                ?? dbContext.Performances.Where(performance => performance.TransactionId == transaction.Id)
                    .Select(performance => performance.Loan.Borrower.FirstName + " " + performance.Loan.Borrower.LastName).FirstOrDefault()
                ?? dbContext.ActivityAssignments.Where(a => a.TransactionId == transaction.Id)
                    .Select(a => a.User.FirstName + " " + a.User.LastName).FirstOrDefault()))
            .ToArrayAsync(cancellationToken);
    }
}
