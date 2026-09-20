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
    }

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaidAt { get; private set; }
    public PaymentMethod PaymentMethod { get; private set; }
    public Guid LoanId { get; private set; }
    public Guid TransactionId { get; private set; }
    public Loan Loan { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;
}
