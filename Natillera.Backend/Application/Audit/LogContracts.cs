using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Audit;

public sealed record LogListItem(
    Guid Id,
    LogEntityType EntityType,
    Guid EntityId,
    LogAction Action,
    DateTime OccurredAt,
    decimal? OldValue,
    decimal? NewValue,
    Guid UserId,
    string UserName);

public sealed record LogEntitySummary(
    string? MemberName,
    int? Year,
    int? Month,
    string? Status,
    decimal? Amount,
    Guid? TransactionId);

public sealed record LogDetailResponse(
    Guid Id,
    LogEntityType EntityType,
    Guid EntityId,
    LogAction Action,
    DateTime OccurredAt,
    decimal? OldValue,
    decimal? NewValue,
    Guid UserId,
    string UserName,
    string UserEmail,
    LogEntitySummary EntitySummary);
