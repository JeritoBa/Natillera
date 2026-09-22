using System.ComponentModel.DataAnnotations;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.MonthlyPayments;

public sealed class CreateMonthlyPaymentRequest
{
    [Required]
    public Guid UserId { get; init; }

    [Range(1, 9999)]
    public int Year { get; init; }

    [Range(1, 12)]
    public int Month { get; init; }

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; init; }
}

public sealed class UpdateMonthlyPaymentRequest
{
    [Required]
    public Guid UserId { get; init; }

    [Range(1, 9999)]
    public int Year { get; init; }

    [Range(1, 12)]
    public int Month { get; init; }

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; init; }
}

public sealed record MonthlyPaymentResponse(
    Guid Id,
    Guid UserId,
    Guid TransactionId,
    decimal Amount,
    int Year,
    int Month,
    DateTime PaidAt,
    PaymentStatus Status,
    string MemberName);

public sealed record MonthlyPaymentOptions(decimal MinimumAmount);

public sealed record MonthlyPaymentListItem(
    Guid Id,
    Guid UserId,
    Guid TransactionId,
    decimal Amount,
    int Year,
    int Month,
    DateTime PaidAt,
    PaymentStatus Status,
    string MemberName);
