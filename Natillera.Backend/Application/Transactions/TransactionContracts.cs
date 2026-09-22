using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Transactions;

public sealed record TransactionListItem(
    Guid Id,
    decimal Amount,
    TransactionDirection Direction,
    TransactionType Type,
    DateTime OccurredAt,
    string Description,
    string? MemberName);
