using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

/// <summary>
/// Reads the raw rows behind a member's pending obligations (MEM-10). Filters by member only; the status rules
/// live in PendingObligationsCalculator. The deactivation check (MEM-04) has its own counting query in UserRepository.
/// </summary>
public sealed class PendingObligationsRepository(NatilleraDbContext dbContext) : IPendingObligationsRepository
{
    public async Task<PendingObligationsData> GetDataAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var fees = await dbContext.MonthlyPayments.AsNoTracking()
            .Where(p => p.UserId == memberId)
            .Select(p => new FeeObligationRow(p.Id, p.SavingPeriod.Year, p.Month, p.Amount, p.Status, p.CreatedAt))
            .ToListAsync(cancellationToken);

        var loans = await dbContext.Loans.AsNoTracking()
            .Where(l => l.BorrowerId == memberId)
            .Select(l => new LoanObligationRow(l.Id, l.StartDate, l.CreatedAt, l.InitialAmount,
                dbContext.LoanPayments
                    .Where(p => p.LoanId == l.Id && p.Status != PaymentStatus.Cancelled)
                    .Select(p => (decimal?)p.Amount).Sum() ?? 0m,
                l.Status))
            .ToListAsync(cancellationToken);

        var interests = await dbContext.Performances.AsNoTracking()
            .Where(p => p.Loan.BorrowerId == memberId)
            .Select(p => new InterestObligationRow(p.Id, p.LoanId, p.CreatedAt, p.Amount, p.Status))
            .ToListAsync(cancellationToken);

        var assignments = await dbContext.ActivityAssignments.AsNoTracking()
            .Where(a => a.UserId == memberId)
            .Select(a => new AssignmentObligationRow(a.Id, a.ActivityId, a.Activity.Name, a.QuantityAssigned,
                a.Activity.UnitSalePrice, a.Status, a.Activity.Status, a.AssignedAt))
            .ToListAsync(cancellationToken);

        return new PendingObligationsData(fees, loans, interests, assignments);
    }
}
