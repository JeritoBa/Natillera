using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Users;

public sealed record MemberDetailResponse(
    MemberInfoResponse Member,
    MemberBalanceResponse Balance,
    IReadOnlyCollection<MemberPendingPaymentResponse> PendingPayments,
    IReadOnlyCollection<MemberTransactionResponse> Transactions);

public sealed record MemberInfoResponse(Guid Id, string FirstName, string LastName, string Email, string Phone,
    UserRole Role, bool IsActive, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record MemberBalanceResponse(decimal Savings, decimal ActivityEarnings, decimal PerformanceEarnings, decimal Total);

public sealed record MemberPendingPaymentResponse(Guid Id, int Year, int Month, decimal Amount, PaymentStatus Status,
    DateTime CreatedAt, Guid TransactionId);

public sealed record MemberTransactionResponse(Guid Id, decimal Amount, TransactionDirection Direction,
    TransactionType Type, DateTime OccurredAt, string Description);

/// <summary>Raw aggregates and lists returned by the repository; the balance is computed in MemberDetailService.</summary>
public sealed record MemberDetailData(
    MemberInfoResponse Member,
    decimal Savings,
    decimal ActivityEarnings,
    decimal PaidPerformancesTotal,
    int ActiveMembersCount,
    IReadOnlyCollection<MemberPendingPaymentResponse> PendingPayments,
    IReadOnlyCollection<MemberTransactionResponse> Transactions);
