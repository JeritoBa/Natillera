using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class MonthlyPayment
{
    private MonthlyPayment()
    {
    }

    public MonthlyPayment(decimal amount, int month, Guid userId, Guid savingPeriodId)
    {
        ValidatePeriod(month);
        ValidateAmount(amount);
        Id = Guid.NewGuid();
        Amount = amount;
        Month = month;
        Status = PaymentStatus.Pending;
        PaidAt = null;
        CreatedAt = DateTime.UtcNow;
        TransactionId = null;
        UserId = userId;
        SavingPeriodId = savingPeriodId;
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public int Month { get; private set; }
    public PaymentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? TransactionId { get; private set; }
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public Guid SavingPeriodId { get; private set; }
    public SavingPeriod SavingPeriod { get; private set; } = null!;
    public Transaction? Transaction { get; private set; }

    public void MarkAsPaid(Guid transactionId)
    {
        if (Status != PaymentStatus.Pending)
            throw new DomainException("Only pending monthly payments can be marked as paid.");

        Status = PaymentStatus.Paid;
        PaidAt = DateTime.UtcNow;
        TransactionId = transactionId;
    }

    public void UpdateDetails(decimal amount, int month, Guid userId)
    {
        if (Status == PaymentStatus.Cancelled)
            throw new DomainException("Cancelled monthly payments cannot be modified.");

        ValidatePeriod(month);
        ValidateAmount(amount);
        Amount = amount;
        Month = month;
        UserId = userId;
    }

    public void Cancel()
    {
        if (Status == PaymentStatus.Cancelled)
            throw new DomainException("Monthly payment is already cancelled.");

        Status = PaymentStatus.Cancelled;
    }

    private static void ValidateAmount(decimal amount)
    {
        if (amount <= 0)
            throw new DomainException("Monthly payment amount must be greater than zero.");
    }

    private static void ValidatePeriod(int month)
    {
        if (month is < 1 or > 12)
            throw new DomainException("Monthly payment must have a valid month.");
    }
}
