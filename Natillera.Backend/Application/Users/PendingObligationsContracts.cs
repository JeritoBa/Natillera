using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Users;

public sealed record PendingObligationsResponse(
    decimal Total,
    PendingObligationGroup<PendingMonthlyPaymentItem> MonthlyPayments,
    PendingObligationGroup<PendingLoanItem> Loans,
    PendingObligationGroup<PendingInterestItem> Interests,
    PendingObligationGroup<PendingActivitySaleItem> ActivitySales);

public sealed record PendingObligationGroup<TItem>(int Count, decimal Amount, IReadOnlyCollection<TItem> Items);

public sealed record PendingMonthlyPaymentItem(Guid Id, int Year, int Month, decimal Amount);

public sealed record PendingLoanItem(Guid Id, DateTime StartDate, decimal InitialAmount, decimal OutstandingPrincipal);

public sealed record PendingInterestItem(Guid Id, Guid LoanId, DateTime CreatedAt, decimal Amount);

public sealed record PendingActivitySaleItem(Guid Id, Guid ActivityId, string ActivityName, int Quantity,
    decimal SalePrice, decimal Amount);

/// <summary>DASH-14: the raw rows of one member, with the data needed to list the member.</summary>
public sealed record MemberPendingObligationsData(Guid UserId, string MemberName, bool IsActive, PendingObligationsData Data);

/// <summary>Raw rows returned by the repository (filtered by member only); the calculator applies the MEM-10 rules.</summary>
public sealed record PendingObligationsData(
    IReadOnlyCollection<FeeObligationRow> MonthlyPayments,
    IReadOnlyCollection<LoanObligationRow> Loans,
    IReadOnlyCollection<InterestObligationRow> Interests,
    IReadOnlyCollection<AssignmentObligationRow> Assignments);

public sealed record FeeObligationRow(Guid Id, int Year, int Month, decimal Amount, PaymentStatus Status, DateTime CreatedAt);

public sealed record LoanObligationRow(Guid Id, DateTime StartDate, DateTime CreatedAt, decimal InitialAmount,
    decimal PrincipalPaid, LoanStatus Status);

public sealed record InterestObligationRow(Guid Id, Guid LoanId, DateTime CreatedAt, decimal Amount, PaymentStatus Status);

public sealed record AssignmentObligationRow(Guid Id, Guid ActivityId, string ActivityName, int Quantity,
    decimal UnitSalePrice, AssignmentStatus Status, ActivityStatus ActivityStatus, DateTime AssignedAt);
