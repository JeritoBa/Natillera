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
    decimal? MyPerformanceShare);

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
