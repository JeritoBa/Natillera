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
    IReadOnlyCollection<DashboardTransactionResponse> RecentTransactions);

public sealed record DashboardTransactionResponse(
    Guid Id,
    decimal Amount,
    TransactionDirection Direction,
    TransactionType Type,
    DateTime OccurredAt,
    string Description,
    string? MemberName);
