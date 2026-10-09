using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Dashboard;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class DashboardRepository(NatilleraDbContext dbContext) : IDashboardRepository
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, CancellationToken cancellationToken = default)
    {
        var availableMoney = await dbContext.Transactions
            .Where(transaction => !transaction.IsCancelled)
            .Select(transaction => transaction.Direction == TransactionDirection.Income ? transaction.Amount : -transaction.Amount)
            .SumAsync(cancellationToken);

        if (string.Equals(role, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
            return await GetAdminSummaryAsync(availableMoney, cancellationToken);

        return await GetMemberSummaryAsync(userId, availableMoney, cancellationToken);
    }

    private async Task<DashboardSummaryResponse> GetAdminSummaryAsync(decimal availableMoney, CancellationToken cancellationToken)
    {
        var lentMoney = await dbContext.Loans
            .Where(loan => loan.Status == LoanStatus.Active)
            .Select(loan => loan.InitialAmount - (dbContext.LoanPayments
                .Where(payment => payment.LoanId == loan.Id && payment.Status != PaymentStatus.Cancelled)
                .Select(payment => (decimal?)payment.Amount).Sum() ?? 0m))
            .SumAsync(cancellationToken);

        var pendingActivitiesInvestment = await dbContext.ActivityAssignments
            .Where(assignment => assignment.Status == AssignmentStatus.Pending)
            .Select(assignment => assignment.QuantityAssigned * assignment.Activity.UnitCost)
            .SumAsync(cancellationToken);

        var recentTransactions = await GetRecentTransactionsAsync(null, cancellationToken);
        return new DashboardSummaryResponse(
            nameof(UserRole.Admin),
            availableMoney,
            availableMoney + lentMoney + pendingActivitiesInvestment,
            lentMoney,
            pendingActivitiesInvestment,
            null,
            null,
            null,
            recentTransactions);
    }

    private async Task<DashboardSummaryResponse> GetMemberSummaryAsync(Guid userId, decimal availableMoney, CancellationToken cancellationToken)
    {
        var monthlyPaymentTransactionIds = dbContext.MonthlyPayments.Where(payment => payment.UserId == userId).Select(payment => payment.TransactionId);
        var loanTransactionIds = dbContext.Loans.Where(loan => loan.BorrowerId == userId).Select(loan => loan.TransactionId);
        var loanPaymentTransactionIds = dbContext.LoanPayments.Where(payment => payment.Loan.BorrowerId == userId).Select(payment => payment.TransactionId);
        var performanceTransactionIds = dbContext.Performances.Where(performance => performance.Loan.BorrowerId == userId && performance.TransactionId != null).Select(performance => performance.TransactionId!.Value);
        var activityTransactionIds = dbContext.ActivityAssignments.Where(assignment => assignment.UserId == userId && assignment.TransactionId != null).Select(assignment => assignment.TransactionId!.Value);
        var userTransactionIds = monthlyPaymentTransactionIds
            .Union(loanTransactionIds)
            .Union(loanPaymentTransactionIds)
            .Union(performanceTransactionIds)
            .Union(activityTransactionIds);

        // Same definition as MemberDetailRepository/MemberDetailService (member balance.total).
        var paidMonthlyPayments = await dbContext.MonthlyPayments
            .Where(payment => payment.UserId == userId && payment.Status == PaymentStatus.Paid)
            .Select(payment => (decimal?)payment.Amount)
            .SumAsync(cancellationToken) ?? 0m;

        var activityEarnings = await dbContext.ActivityAssignments
            .Where(assignment => assignment.UserId == userId && assignment.Status != AssignmentStatus.Cancelled)
            .Select(assignment => (decimal?)(assignment.QuantityAssigned * (assignment.Activity.UnitSalePrice - assignment.Activity.UnitCost)))
            .SumAsync(cancellationToken) ?? 0m;

        var paidPerformancesTotal = await dbContext.Performances
            .Where(performance => performance.Status == PaymentStatus.Paid)
            .Select(performance => (decimal?)performance.Amount)
            .SumAsync(cancellationToken) ?? 0m;

        var activeMembersCount = await dbContext.Users
            .CountAsync(user => user.IsActive && user.Role == UserRole.Member, cancellationToken);

        var performanceShare = activeMembersCount == 0
            ? 0m
            : Math.Round(paidPerformancesTotal / activeMembersCount, 2, MidpointRounding.AwayFromZero);

        var mySavings = paidMonthlyPayments + activityEarnings + performanceShare;
        var myEarnings = activityEarnings + performanceShare;

        var now = DateTime.UtcNow;
        var hasCurrentPayment = await dbContext.MonthlyPayments.AnyAsync(payment =>
            payment.UserId == userId && payment.Year == now.Year && payment.Month == now.Month && payment.Status == PaymentStatus.Paid,
            cancellationToken);

        var recentTransactions = await GetRecentTransactionsAsync(userTransactionIds, cancellationToken);
        return new DashboardSummaryResponse(
            nameof(UserRole.Member),
            availableMoney,
            null,
            null,
            null,
            mySavings,
            myEarnings,
            hasCurrentPayment ? 0 : 1,
            recentTransactions);
    }

    private Task<DashboardTransactionResponse[]> GetRecentTransactionsAsync(IQueryable<Guid>? transactionIds, CancellationToken cancellationToken)
    {
        var query = dbContext.Transactions.Where(transaction => !transaction.IsCancelled);
        if (transactionIds is not null) query = query.Where(transaction => transactionIds.Contains(transaction.Id));

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
