using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class Performance
{
    private Performance()
    {
    }

    public Performance(decimal amount, string description, Guid loanId)
    {
        Validate(amount, description);

        Id = Guid.NewGuid();
        Amount = amount;
        Description = description.Trim();
        Status = PaymentStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        TransactionId = null;
        LoanId = loanId;
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public string Description { get; private set; } = null!;
    public PaymentStatus Status { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? TransactionId { get; private set; }
    public Guid LoanId { get; private set; }
    public Transaction? Transaction { get; private set; }
    public Loan Loan { get; private set; } = null!;

    public void MarkAsPaid(Guid transactionId)
    {
        if (Status != PaymentStatus.Pending)
            throw new DomainException("Only pending performances can be marked as paid.");

        Status = PaymentStatus.Paid;
        PaidAt = DateTime.UtcNow;
        TransactionId = transactionId;
    }

    public void UpdateDetails(decimal amount, string description)
    {
        if (Status == PaymentStatus.Cancelled)
            throw new DomainException("Cancelled performances cannot be modified.");

        Validate(amount, description);
        Amount = amount;
        Description = description.Trim();
    }

    public void Cancel()
    {
        if (Status == PaymentStatus.Cancelled)
            throw new DomainException("Performance is already cancelled.");

        Status = PaymentStatus.Cancelled;
    }

    private static void Validate(decimal amount, string description)
    {
        if (amount <= 0)
            throw new DomainException("Performance amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(description) || description.Length > 200)
            throw new DomainException("Performance description is required and must not exceed 200 characters.");
    }
}
