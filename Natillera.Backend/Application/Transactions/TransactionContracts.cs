using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Transactions;

public sealed record TransactionListItem(
    Guid Id,
    decimal Amount,
    TransactionDirection Direction,
    TransactionType Type,
    DateTime OccurredAt,
    string Description,
    string? MemberName,
    bool IsCancelled);

public sealed record TransactionSummary(decimal Income, decimal Expense);

public sealed record TransactionStatusCounts(int Active, int Cancelled);

public sealed record TransactionMonthCount(string Month, int Count);

/// <summary>TX-03 / UI-16: one page of the period transactions with the totals of the whole filtered set.
/// <c>Months</c> count the records of the chosen status view; <c>StatusCounts</c> follow type and month but not the status.</summary>
public sealed record TransactionPageResponse(
    IReadOnlyCollection<TransactionListItem> Items,
    int Total,
    int Page,
    int PageSize,
    TransactionSummary Summary,
    IReadOnlyCollection<TransactionMonthCount> Months,
    TransactionStatusCounts StatusCounts);
