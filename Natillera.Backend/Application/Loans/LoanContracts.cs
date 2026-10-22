using System.ComponentModel.DataAnnotations;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Loans;

public sealed class LoanRequest
{
    [Required]
    public Guid BorrowerId { get; init; }

    [Range(0.01, double.MaxValue)]
    public decimal InitialAmount { get; init; }

    [Range(0, 100)]
    public decimal InterestRate { get; init; }

    [Required]
    public DateTime StartDate { get; init; }

    [MaxLength(Loan.DescriptionMaxLength)]
    public string? Description { get; init; }
}

public sealed class LoanPaymentRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; init; }

    [Required]
    public PaymentMethod? PaymentMethod { get; init; }
}

public sealed class InterestPaymentRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; init; }

    [Required, MaxLength(200)]
    public string Description { get; init; } = string.Empty;

    [Required]
    public PaymentStatus? Status { get; init; }
}

public sealed record LoanListItem(
    Guid Id,
    Guid BorrowerId,
    string BorrowerName,
    decimal InitialAmount,
    decimal InterestRate,
    DateTime StartDate,
    LoanStatus Status,
    decimal OutstandingPrincipal,
    string? Description = null);

public sealed record LoanListData(
    Guid Id,
    Guid BorrowerId,
    string BorrowerName,
    decimal InitialAmount,
    decimal InterestRate,
    DateTime StartDate,
    LoanStatus Status,
    decimal PrincipalPaid,
    string? Description = null);

public sealed record LoanPaymentResponse(
    Guid Id,
    Guid LoanId,
    Guid TransactionId,
    decimal Amount,
    DateTime PaidAt,
    PaymentMethod PaymentMethod,
    PaymentStatus Status);

public sealed record InterestPaymentResponse(
    Guid Id,
    Guid LoanId,
    Guid? TransactionId,
    decimal Amount,
    string Description,
    PaymentStatus Status,
    DateTime CreatedAt,
    DateTime? PaidAt);

public sealed record LoanSummary(
    decimal PrincipalPaid,
    decimal OutstandingPrincipal,
    decimal InterestGenerated,
    decimal InterestPaid,
    decimal OutstandingInterest,
    decimal TotalOutstanding);

public sealed record LoanDetailResponse(
    Guid Id,
    Guid TransactionId,
    Guid BorrowerId,
    string BorrowerName,
    decimal InitialAmount,
    decimal InterestRate,
    DateTime StartDate,
    string? Description,
    DateTime? EndDate,
    LoanStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    LoanSummary Summary,
    IReadOnlyCollection<LoanPaymentResponse> Payments,
    IReadOnlyCollection<InterestPaymentResponse> InterestPayments);
