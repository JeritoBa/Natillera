using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class Loan
{
    private readonly List<LoanPayment> _payments = [];
    private readonly List<Performance> _performances = [];

    private Loan()
    {
    }

    public Loan(decimal initialAmount, decimal interestRate, DateTime startDate, Guid borrowerId,
        Guid transactionId)
    {
        if (initialAmount <= 0)
            throw new DomainException("Loan amount must be greater than zero.");
        if (interestRate < 0)
            throw new DomainException("Loan interest rate cannot be negative.");

        Id = Guid.NewGuid();
        InitialAmount = initialAmount;
        InterestRate = interestRate;
        StartDate = startDate.Date;
        Status = LoanStatus.Active;
        CreatedAt = DateTime.UtcNow;
        BorrowerId = borrowerId;
        TransactionId = transactionId;
    }

    public Guid Id { get; private set; }
    public decimal InitialAmount { get; private set; }
    public decimal InterestRate { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public LoanStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public Guid BorrowerId { get; private set; }
    public Guid TransactionId { get; private set; }
    public User Borrower { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;
    public IReadOnlyCollection<LoanPayment> Payments => _payments;
    public IReadOnlyCollection<Performance> Performances => _performances;

    public decimal OutstandingPrincipal() => Math.Max(0, InitialAmount - _payments.Sum(payment => payment.Amount));

    public decimal CalculateMonthlyInterest()
    {
        return decimal.Round(OutstandingPrincipal() * (InterestRate / 100m), 2, MidpointRounding.ToEven);
    }

    public void EnsurePaymentAllowed(decimal amount)
    {
        if (Status != LoanStatus.Active)
            throw new DomainException("Only active loans can receive payments.");
        if (amount <= 0)
            throw new DomainException("Loan payment amount must be greater than zero.");
        if (amount > OutstandingPrincipal())
            throw new DomainException("Loan payment cannot exceed the outstanding principal.");
    }

    public void MarkAsPaid()
    {
        if (OutstandingPrincipal() > 0 || _performances.Any(performance => performance.Status == PaymentStatus.Pending))
            throw new DomainException("A loan cannot be marked as paid while principal or performance is pending.");

        Status = LoanStatus.Paid;
        EndDate = DateTime.UtcNow.Date;
        UpdatedAt = DateTime.UtcNow;
    }
}
