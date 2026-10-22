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
        Validate(initialAmount, interestRate);

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
    public Guid SavingPeriodId { get; private set; }
    public SavingPeriod SavingPeriod { get; private set; } = null!;
    public User Borrower { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;
    public IReadOnlyCollection<LoanPayment> Payments => _payments;
    public IReadOnlyCollection<Performance> Performances => _performances;

    public decimal PrincipalPaid() =>
        _payments.Where(payment => payment.Status != PaymentStatus.Cancelled).Sum(payment => payment.Amount);

    public decimal OutstandingPrincipal() => CalculateOutstandingPrincipal(InitialAmount, PrincipalPaid());

    public static decimal CalculateOutstandingPrincipal(decimal initialAmount, decimal principalPaid) =>
        Math.Max(0m, initialAmount - principalPaid);

    public decimal CalculateMonthlyInterest()
    {
        return decimal.Round(OutstandingPrincipal() * (InterestRate / 100m), 2, MidpointRounding.ToEven);
    }

    public void EnsurePaymentAllowed(decimal amount, decimal previousAmount = 0)
    {
        if (Status == LoanStatus.Cancelled)
            throw new DomainException("Cancelled loans cannot receive payments.");
        if (amount <= 0)
            throw new DomainException("Loan payment amount must be greater than zero.");
        if (amount > OutstandingPrincipal() + previousAmount)
            throw new DomainException("Loan payment cannot exceed the outstanding principal.");
    }

    public bool HasActivePayments() =>
        _payments.Any(payment => payment.Status != PaymentStatus.Cancelled)
        || _performances.Any(performance => performance.Status != PaymentStatus.Cancelled);

    public void UpdateDetails(decimal initialAmount, decimal interestRate, DateTime startDate, Guid borrowerId)
    {
        if (Status == LoanStatus.Cancelled)
            throw new DomainException("Cancelled loans cannot be modified.");
        if (HasActivePayments())
            throw new DomainException("Loan cannot be modified because it has payments.");

        Validate(initialAmount, interestRate);
        InitialAmount = initialAmount;
        InterestRate = interestRate;
        StartDate = startDate.Date;
        BorrowerId = borrowerId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status == LoanStatus.Cancelled)
            throw new DomainException("Loan is already cancelled.");
        if (HasActivePayments())
            throw new DomainException("Loan cannot be cancelled because it has payments.");

        Status = LoanStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    public LoanPayment RegisterPayment(decimal amount, PaymentMethod method, Guid transactionId)
    {
        EnsurePaymentAllowed(amount);
        var payment = new LoanPayment(amount, DateTime.UtcNow, method, Id, transactionId);
        _payments.Add(payment);
        return payment;
    }

    public void UpdatePayment(LoanPayment payment, decimal amount, PaymentMethod method)
    {
        EnsurePaymentAllowed(amount, payment.Amount);
        payment.Update(amount, method);
    }

    public Performance RegisterInterest(decimal amount, string description)
    {
        if (Status == LoanStatus.Cancelled)
            throw new DomainException("Cancelled loans cannot receive interest payments.");

        var performance = new Performance(amount, description, Id);
        _performances.Add(performance);
        return performance;
    }

    public void RefreshStatus()
    {
        if (Status == LoanStatus.Cancelled)
            return;

        var settled = OutstandingPrincipal() == 0
            && !_performances.Any(performance => performance.Status == PaymentStatus.Pending);

        if (settled && Status != LoanStatus.Paid)
        {
            Status = LoanStatus.Paid;
            EndDate = DateTime.UtcNow.Date;
            UpdatedAt = DateTime.UtcNow;
        }
        else if (!settled && Status == LoanStatus.Paid)
        {
            Status = LoanStatus.Active;
            EndDate = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    private static void Validate(decimal initialAmount, decimal interestRate)
    {
        if (initialAmount <= 0)
            throw new DomainException("Loan amount must be greater than zero.");
        if (interestRate < 0)
            throw new DomainException("Loan interest rate cannot be negative.");
    }
}
