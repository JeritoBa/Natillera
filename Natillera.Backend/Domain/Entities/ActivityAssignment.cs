using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class ActivityAssignment
{
    private ActivityAssignment()
    {
    }

    public ActivityAssignment(int quantityAssigned, Guid activityId, Guid userId, Guid transactionId)
    {
        if (quantityAssigned <= 0)
            throw new DomainException("Assigned quantity must be greater than zero.");

        Id = Guid.NewGuid();
        QuantityAssigned = quantityAssigned;
        AssignedAt = DateTime.UtcNow;
        Status = AssignmentStatus.Pending;
        ActivityId = activityId;
        UserId = userId;
        TransactionId = transactionId;
    }

    public Guid Id { get; private set; }
    public int QuantityAssigned { get; private set; }
    public DateTime AssignedAt { get; private set; }
    public AssignmentStatus Status { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public Guid ActivityId { get; private set; }
    public Guid UserId { get; private set; }
    public Guid TransactionId { get; private set; }
    public Activity Activity { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;

    public void MarkAsPaid()
    {
        if (Status != AssignmentStatus.Pending)
            throw new DomainException("Only pending assignments can be marked as paid.");

        Status = AssignmentStatus.Paid;
        PaidAt = DateTime.UtcNow;
    }
}
