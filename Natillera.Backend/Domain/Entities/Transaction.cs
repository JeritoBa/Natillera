using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class Transaction
{
    private Transaction()
    {
    }

    public Transaction(decimal amount, TransactionDirection direction, TransactionType type,
        string description, DateTime? occurredAt = null)
    {
        Validate(amount, description);
        Id = Guid.NewGuid();
        Amount = amount;
        Direction = direction;
        Type = type;
        Description = description.Trim();
        OccurredAt = occurredAt ?? DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public TransactionDirection Direction { get; private set; }
    public TransactionType Type { get; private set; }
    public DateTime OccurredAt { get; private set; }
    public string Description { get; private set; } = null!;
    public bool IsCancelled { get; private set; }
    public Guid SavingPeriodId { get; private set; }
    public SavingPeriod SavingPeriod { get; private set; } = null!;

    public void Update(decimal amount, TransactionDirection direction, TransactionType type, string description)
    {
        if (IsCancelled)
            throw new DomainException("Cancelled transactions cannot be modified.");

        Validate(amount, description);
        Amount = amount;
        Direction = direction;
        Type = type;
        Description = description.Trim();
    }

    public void Cancel()
    {
        if (IsCancelled)
            throw new DomainException("Transaction is already cancelled.");

        IsCancelled = true;
    }

    private static void Validate(decimal amount, string description)
    {
        if (amount <= 0)
            throw new DomainException("Transaction amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(description) || description.Length > 200)
            throw new DomainException("Transaction description is required and must not exceed 200 characters.");
    }
}
