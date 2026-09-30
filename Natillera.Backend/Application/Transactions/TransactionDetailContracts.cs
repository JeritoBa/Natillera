using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Transactions;

public sealed record TransactionDetailResponse(Guid Id, decimal Amount, TransactionDirection Direction, TransactionType Type, DateTime OccurredAt, string Description, TransactionSourceDetail Source);

public sealed class TransactionSourceDetail
{
    public string Entity { get; init; } = string.Empty;
    public Guid EntityId { get; init; }
    public string? MemberName { get; init; }
    public int? Year { get; init; }
    public int? Month { get; init; }
    public string? Status { get; init; }
    public DateTime? PaidAt { get; init; }
    public string? ActivityName { get; init; }
    public string? ActivityDescription { get; init; }
    public int? ActivityQuantity { get; init; }
    public int? QuantityAssigned { get; init; }
    public decimal? UnitCost { get; init; }
    public decimal? UnitSalePrice { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? AssignedAt { get; init; }
    public decimal? InitialAmount { get; init; }
    public decimal? InterestRate { get; init; }
    public DateTime? LoanStartDate { get; init; }
    public DateTime? LoanEndDate { get; init; }
    public string? PaymentMethod { get; init; }
}
