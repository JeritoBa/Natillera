using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class Performance
{
    private Performance()
    {
    }

    public Performance(decimal amount, string description, Guid transactionId, Guid loanId)
    {
        if (amount <= 0)
            throw new DomainException("Performance amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(description) || description.Length > 200)
            throw new DomainException("Performance description is required and must not exceed 200 characters.");

        Id = Guid.NewGuid();
        Amount = amount;
        Description = description.Trim();
        Status = PaymentStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        TransactionId = transactionId;
        LoanId = loanId;
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public string Description { get; private set; } = null!;
    public PaymentStatus Status { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid TransactionId { get; private set; }
    public Guid LoanId { get; private set; }
    public Transaction Transaction { get; private set; } = null!;
    public Loan Loan { get; private set; } = null!;

    public void MarkAsPaid()
    {
        if (Status != PaymentStatus.Pending)
            throw new DomainException("Only pending performances can be marked as paid.");

        Status = PaymentStatus.Paid;
        PaidAt = DateTime.UtcNow;
    }
}
