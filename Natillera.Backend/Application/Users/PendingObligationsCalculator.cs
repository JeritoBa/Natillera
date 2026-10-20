using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Users;

/// <summary>MEM-10 / DASH-11: what a member still owes. Derived on read, never stored (FIN-09).</summary>
public static class PendingObligationsCalculator
{
    public static PendingObligationsResponse Calculate(PendingObligationsData data)
    {
        var fees = data.MonthlyPayments
            .Where(fee => fee.Status == PaymentStatus.Pending)
            .OrderBy(fee => fee.Year).ThenBy(fee => fee.Month).ThenBy(fee => fee.CreatedAt)
            .Select(fee => new PendingMonthlyPaymentItem(fee.Id, fee.Year, fee.Month, fee.Amount))
            .ToList();

        // Only Active loans with principal still owed; a loan with principal 0 and Pending interest shows under interests.
        var loans = data.Loans
            .Where(loan => loan.Status == LoanStatus.Active)
            .Select(loan => new
            {
                Loan = loan,
                Outstanding = Domain.Entities.Loan.CalculateOutstandingPrincipal(loan.InitialAmount, loan.PrincipalPaid)
            })
            .Where(x => x.Outstanding > 0m)
            .OrderBy(x => x.Loan.StartDate).ThenBy(x => x.Loan.CreatedAt)
            .Select(x => new PendingLoanItem(x.Loan.Id, x.Loan.StartDate, x.Loan.InitialAmount, x.Outstanding))
            .ToList();

        var interests = data.Interests
            .Where(interest => interest.Status == PaymentStatus.Pending)
            .OrderBy(interest => interest.CreatedAt)
            .Select(interest => new PendingInterestItem(interest.Id, interest.LoanId, interest.CreatedAt, interest.Amount))
            .ToList();

        var sales = data.Assignments
            .Where(a => a.Status == AssignmentStatus.Pending && a.ActivityStatus != ActivityStatus.Cancelled)
            .OrderBy(a => a.AssignedAt).ThenBy(a => a.ActivityName, StringComparer.CurrentCultureIgnoreCase)
            .Select(a => new PendingActivitySaleItem(a.Id, a.ActivityId, a.ActivityName, a.Quantity, a.UnitSalePrice,
                a.Quantity * a.UnitSalePrice))
            .ToList();

        var feeGroup = new PendingObligationGroup<PendingMonthlyPaymentItem>(fees.Count, fees.Sum(i => i.Amount), fees);
        var loanGroup = new PendingObligationGroup<PendingLoanItem>(loans.Count, loans.Sum(i => i.OutstandingPrincipal), loans);
        var interestGroup = new PendingObligationGroup<PendingInterestItem>(interests.Count, interests.Sum(i => i.Amount), interests);
        var saleGroup = new PendingObligationGroup<PendingActivitySaleItem>(sales.Count, sales.Sum(i => i.Amount), sales);

        return new PendingObligationsResponse(
            feeGroup.Amount + loanGroup.Amount + interestGroup.Amount + saleGroup.Amount,
            feeGroup, loanGroup, interestGroup, saleGroup);
    }
}
