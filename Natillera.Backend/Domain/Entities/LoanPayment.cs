using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class LoanPayment
{
    private LoanPayment()
    {
    }

    public LoanPayment(decimal amount, DateTime paidAt, PaymentMethod paymentMethod, Guid loanId,
        Guid transactionId)
    {
        if (amount <= 0)
            throw new DomainException("Loan payment amount must be greater than zero.");

        Id = Guid.NewGuid();
        Amount = amount;
        PaidAt = paidAt;
        PaymentMethod = paymentMethod;
        LoanId = loanId;
        TransactionId = transactionId;
        Status = PaymentStatus.Paid;
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaidAt { get; private set; }
    public PaymentMethod PaymentMethod { get; private set; }
    public PaymentStatus Status { get; private set; }
    public Guid LoanId { get; private set; }
    public Guid TransactionId { get; private set; }
    public Loan Loan { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;

    public void Update(decimal amount, PaymentMethod method)
    {
        if (Status == PaymentStatus.Cancelled)
            throw new DomainException("Cancelled loan payments cannot be modified.");
        if (amount <= 0)
            throw new DomainException("Loan payment amount must be greater than zero.");

        Amount = amount;
        PaymentMethod = method;
    }

    public void Cancel()
    {
        if (Status == PaymentStatus.Cancelled)
            throw new DomainException("Loan payment is already cancelled.");

        Status = PaymentStatus.Cancelled;
    }
}
