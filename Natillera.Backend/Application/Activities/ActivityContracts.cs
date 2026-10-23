using System.ComponentModel.DataAnnotations;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Activities;

public sealed class ActivityRequest
{
    [Required, MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [Required, MaxLength(200)]
    public string Description { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantity { get; init; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitCost { get; init; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitSalePrice { get; init; }

    [Required]
    public DateTime StartDate { get; init; }
}

public sealed class ActivityAssignmentRequest
{
    [Required]
    public Guid UserId { get; init; }

    [Range(1, int.MaxValue)]
    public int QuantityAssigned { get; init; }
}

public sealed class ActivityAssignmentUpdateRequest
{
    [Range(1, int.MaxValue)]
    public int QuantityAssigned { get; init; }

    [Required]
    public AssignmentStatus? Status { get; init; }
}

public sealed class ExtraCostRequest
{
    [Required, MaxLength(200)]
    public string Description { get; init; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; init; }

    [Required]
    public ExtraCostStatus? Status { get; init; }
}

public sealed record ActivityListData(
    Guid Id,
    string Name,
    string Description,
    int Quantity,
    decimal UnitCost,
    decimal UnitSalePrice,
    DateTime StartDate,
    ActivityStatus Status,
    int AssignedQuantity);

public sealed record ActivityListItem(
    Guid Id,
    string Name,
    string Description,
    int Quantity,
    decimal UnitCost,
    decimal UnitSalePrice,
    decimal TotalCost,
    int AssignedQuantity,
    int AvailableQuantity,
    DateTime StartDate,
    ActivityStatus Status);

public sealed record ActivityAssignmentResponse(
    Guid Id,
    Guid ActivityId,
    Guid UserId,
    string MemberName,
    int QuantityAssigned,
    decimal SaleAmount,
    AssignmentStatus Status,
    DateTime AssignedAt,
    DateTime? PaidAt,
    Guid? TransactionId);

public sealed record ExtraCostResponse(
    Guid Id,
    Guid ActivityId,
    string Description,
    decimal Amount,
    ExtraCostStatus Status,
    DateTime CreatedAt,
    DateTime? PaidAt,
    Guid? TransactionId);

public sealed record ActivityDetailResponse(
    Guid Id,
    Guid TransactionId,
    string Name,
    string Description,
    int Quantity,
    decimal UnitCost,
    decimal UnitSalePrice,
    decimal TotalCost,
    int AssignedQuantity,
    int AvailableQuantity,
    DateTime StartDate,
    ActivityStatus Status,
    DateTime CreatedAt,
    IReadOnlyCollection<ActivityAssignmentResponse> Assignments,
    IReadOnlyCollection<ExtraCostResponse> ExtraCosts);
