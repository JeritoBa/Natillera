using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class MonthlyPayment
{
    private MonthlyPayment()
    {
    }

    public MonthlyPayment(decimal amount, int year, int month, Guid userId, Guid transactionId)
    {
        ValidatePeriod(year, month);
        ValidateAmount(amount);
        Id = Guid.NewGuid();
        Amount = amount;
        PaidAt = DateTime.UtcNow;
        Year = year;
        Month = month;
        Status = PaymentStatus.Paid;
        CreatedAt = DateTime.UtcNow;
        UserId = userId;
        TransactionId = transactionId;
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaidAt { get; private set; }
    public int Year { get; private set; }
    public int Month { get; private set; }
    public PaymentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid TransactionId { get; private set; }
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;

    public void Update(decimal amount, PaymentStatus status)
    {
        ValidateAmount(amount);
        Amount = amount;
        Status = status;
    }

    public void UpdateDetails(decimal amount, int year, int month, Guid userId)
    {
        ValidatePeriod(year, month);
        ValidateAmount(amount);
        Amount = amount;
        Year = year;
        Month = month;
        UserId = userId;
    }

    private static void ValidateAmount(decimal amount)
    {
        if (amount <= 0)
            throw new DomainException("Monthly payment amount must be greater than zero.");
    }

    private static void ValidatePeriod(int year, int month)
    {
        if (year < 1 || month is < 1 or > 12)
            throw new DomainException("Monthly payment must have a valid year and month.");
    }
}
