using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class ExtraCost
{
    private ExtraCost()
    {
    }

    public ExtraCost(string description, decimal amount, Guid activityId)
    {
        Validate(description, amount);

        Id = Guid.NewGuid();
        Description = description.Trim();
        Amount = amount;
        Status = ExtraCostStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        ActivityId = activityId;
        TransactionId = null;
    }

    public Guid Id { get; private set; }
    public string Description { get; private set; } = null!;
    public decimal Amount { get; private set; }
    public ExtraCostStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public Guid ActivityId { get; private set; }
    public Guid? TransactionId { get; private set; }
    public Activity Activity { get; private set; } = null!;
    public Transaction? Transaction { get; private set; }

    public void MarkAsPaid(Guid transactionId)
    {
        if (Status != ExtraCostStatus.Pending)
            throw new DomainException("Only pending extra costs can be marked as paid.");

        Status = ExtraCostStatus.Paid;
        PaidAt = DateTime.UtcNow;
        TransactionId = transactionId;
    }

    public void UpdateDetails(string description, decimal amount)
    {
        if (Status == ExtraCostStatus.Cancelled)
            throw new DomainException("Cancelled extra costs cannot be modified.");
        Validate(description, amount);

        Description = description.Trim();
        Amount = amount;
    }

    public void Cancel()
    {
        if (Status == ExtraCostStatus.Cancelled)
            throw new DomainException("Extra cost is already cancelled.");

        Status = ExtraCostStatus.Cancelled;
    }

    private static void Validate(string description, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Extra cost description is required.");
        if (description.Trim().Length > 200)
            throw new DomainException("Extra cost description must not exceed 200 characters.");
        if (amount <= 0)
            throw new DomainException("Extra cost amount must be greater than zero.");
    }
}
