using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Dashboard;

public sealed record DashboardSummaryResponse(
    string Role,
    decimal AvailableMoney,
    decimal? TotalNatilleraBalance,
    decimal? LentMoney,
    decimal? PendingActivitiesInvestment,
    decimal? MySavings,
    decimal? MyEarnings,
    int? PendingPayments,
    IReadOnlyCollection<DashboardTransactionResponse> RecentTransactions,
    IReadOnlyCollection<TopSellerItem> TopSellers,
    decimal? MyPaidMonthlyPayments,
    decimal? LoanInterestEarned,
    decimal? ActivityEarnings,
    decimal? MyActivityEarnings,
    decimal? MyPerformanceShare,
    PendingObligationsResponse? PendingObligations = null,
    decimal? SharedInterestPool = null,
    decimal? PaidExtraCosts = null,
    decimal? PaidMonthlyPayments = null,
    IReadOnlyCollection<MemberPendingObligationsItem>? MembersPendingObligations = null);

public sealed record PendingKindTotal(int Count, decimal Amount);

/// <summary>DASH-14: one row per member with total pending greater than zero in the period.</summary>
public sealed record MemberPendingObligationsItem(
    Guid UserId,
    string MemberName,
    bool IsActive,
    decimal Total,
    PendingKindTotal MonthlyPayments,
    PendingKindTotal Loans,
    PendingKindTotal Interests,
    PendingKindTotal ActivitySales);

public sealed record TopSellerItem(
    Guid UserId,
    string MemberName,
    int UnitsSold,
    decimal CollectedAmount,
    decimal Earnings);

public sealed record DashboardTransactionResponse(
    Guid Id,
    decimal Amount,
    TransactionDirection Direction,
    TransactionType Type,
    DateTime OccurredAt,
    string Description,
    string? MemberName);
