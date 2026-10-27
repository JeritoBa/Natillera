using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

/// <summary>
/// Reads the raw rows behind a member's pending obligations (MEM-10). Filters by member and saving period (PER-06); the status rules
/// live in PendingObligationsCalculator. The deactivation check (MEM-04) has its own counting query in UserRepository.
/// </summary>
public sealed class PendingObligationsRepository(NatilleraDbContext dbContext) : IPendingObligationsRepository
{
    public async Task<PendingObligationsData> GetDataAsync(Guid memberId, Guid savingPeriodId, CancellationToken cancellationToken = default)
    {
        var fees = await dbContext.MonthlyPayments.AsNoTracking()
            .Where(p => p.UserId == memberId && p.SavingPeriodId == savingPeriodId)
            .Select(p => new FeeObligationRow(p.Id, p.SavingPeriod.Year, p.Month, p.Amount, p.Status, p.CreatedAt))
            .ToListAsync(cancellationToken);

        var loans = await dbContext.Loans.AsNoTracking()
            .Where(l => l.BorrowerId == memberId && l.SavingPeriodId == savingPeriodId)
            .Select(l => new LoanObligationRow(l.Id, l.StartDate, l.CreatedAt, l.InitialAmount,
                dbContext.LoanPayments
                    .Where(p => p.LoanId == l.Id && p.Status != PaymentStatus.Cancelled)
                    .Select(p => (decimal?)p.Amount).Sum() ?? 0m,
                l.Status))
            .ToListAsync(cancellationToken);

        var interests = await dbContext.Performances.AsNoTracking()
            .Where(p => p.Loan.BorrowerId == memberId && p.Loan.SavingPeriodId == savingPeriodId)
            .Select(p => new InterestObligationRow(p.Id, p.LoanId, p.CreatedAt, p.Amount, p.Status))
            .ToListAsync(cancellationToken);

        var assignments = await dbContext.ActivityAssignments.AsNoTracking()
            .Where(a => a.UserId == memberId && a.Activity.SavingPeriodId == savingPeriodId)
            .Select(a => new AssignmentObligationRow(a.Id, a.ActivityId, a.Activity.Name, a.QuantityAssigned,
                a.Activity.UnitSalePrice, a.Status, a.Activity.Status, a.AssignedAt))
            .ToListAsync(cancellationToken);

        return new PendingObligationsData(fees, loans, interests, assignments);
    }

    // DASH-14, PER-06: same period filters as GetDataAsync without the member filter; 5 queries in total, grouped in memory.
    public async Task<IReadOnlyCollection<MemberPendingObligationsData>> GetForAllMembersAsync(Guid savingPeriodId, CancellationToken cancellationToken = default)
    {
        var fees = await dbContext.MonthlyPayments.AsNoTracking()
            .Where(p => p.SavingPeriodId == savingPeriodId)
            .Select(p => new { p.UserId, Row = new FeeObligationRow(p.Id, p.SavingPeriod.Year, p.Month, p.Amount, p.Status, p.CreatedAt) })
            .ToListAsync(cancellationToken);

        var loans = await dbContext.Loans.AsNoTracking()
            .Where(l => l.SavingPeriodId == savingPeriodId)
            .Select(l => new
            {
                UserId = l.BorrowerId,
                Row = new LoanObligationRow(l.Id, l.StartDate, l.CreatedAt, l.InitialAmount,
                    dbContext.LoanPayments
                        .Where(p => p.LoanId == l.Id && p.Status != PaymentStatus.Cancelled)
                        .Select(p => (decimal?)p.Amount).Sum() ?? 0m,
                    l.Status)
            })
            .ToListAsync(cancellationToken);

        var interests = await dbContext.Performances.AsNoTracking()
            .Where(p => p.Loan.SavingPeriodId == savingPeriodId)
            .Select(p => new { UserId = p.Loan.BorrowerId, Row = new InterestObligationRow(p.Id, p.LoanId, p.CreatedAt, p.Amount, p.Status) })
            .ToListAsync(cancellationToken);

        var assignments = await dbContext.ActivityAssignments.AsNoTracking()
            .Where(a => a.Activity.SavingPeriodId == savingPeriodId)
            .Select(a => new
            {
                a.UserId,
                Row = new AssignmentObligationRow(a.Id, a.ActivityId, a.Activity.Name, a.QuantityAssigned,
                    a.Activity.UnitSalePrice, a.Status, a.Activity.Status, a.AssignedAt)
            })
            .ToListAsync(cancellationToken);

        var userIds = fees.Select(x => x.UserId)
            .Concat(loans.Select(x => x.UserId))
            .Concat(interests.Select(x => x.UserId))
            .Concat(assignments.Select(x => x.UserId))
            .Distinct().ToList();

        var users = await dbContext.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName, u.IsActive })
            .ToListAsync(cancellationToken);

        var feesByUser = fees.ToLookup(x => x.UserId, x => x.Row);
        var loansByUser = loans.ToLookup(x => x.UserId, x => x.Row);
        var interestsByUser = interests.ToLookup(x => x.UserId, x => x.Row);
        var assignmentsByUser = assignments.ToLookup(x => x.UserId, x => x.Row);

        return users
            .Select(u => new MemberPendingObligationsData(u.Id, u.Name, u.IsActive,
                new PendingObligationsData(feesByUser[u.Id].ToList(), loansByUser[u.Id].ToList(),
                    interestsByUser[u.Id].ToList(), assignmentsByUser[u.Id].ToList())))
            .ToList();
    }
}
