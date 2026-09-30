using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

/// <summary>Immutable audit record. It has no update operations by design.</summary>
public class Log
{
    private Log()
    {
    }

    public Log(Guid userId, LogEntityType entityType, Guid entityId, LogAction action,
        decimal? oldValue = null, decimal? newValue = null, DateTime? occurredAt = null)
    {
        if (userId == Guid.Empty)
            throw new DomainException("Log user id is required.");
        if (entityId == Guid.Empty)
            throw new DomainException("Log entity id is required.");
        if (!Enum.IsDefined(entityType))
            throw new DomainException("Log entity type is invalid.");
        if (!Enum.IsDefined(action))
            throw new DomainException("Log action is invalid.");

        Id = Guid.NewGuid();
        UserId = userId;
        EntityType = entityType;
        EntityId = entityId;
        Action = action;
        OldValue = oldValue;
        NewValue = newValue;
        OccurredAt = occurredAt ?? DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public LogEntityType EntityType { get; private set; }
    public Guid EntityId { get; private set; }
    public LogAction Action { get; private set; }
    public DateTime OccurredAt { get; private set; }
    public decimal? OldValue { get; private set; }
    public decimal? NewValue { get; private set; }
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
}
