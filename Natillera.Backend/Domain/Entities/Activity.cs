using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class Activity
{
    private readonly List<ActivityAssignment> _assignments = [];

    private Activity()
    {
    }

    public Activity(string name, string description, int quantity, decimal unitCost, decimal unitSalePrice,
        DateTime startDate, Guid transactionId)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            throw new DomainException("Activity name is required and must not exceed 100 characters.");
        if (string.IsNullOrWhiteSpace(description) || description.Length > 200)
            throw new DomainException("Activity description is required and must not exceed 200 characters.");
        if (quantity <= 0 || unitCost <= 0 || unitSalePrice <= 0)
            throw new DomainException("Activity quantities and prices must be greater than zero.");

        Id = Guid.NewGuid();
        Name = name.Trim();
        Description = description.Trim();
        Quantity = quantity;
        UnitCost = unitCost;
        UnitSalePrice = unitSalePrice;
        StartDate = startDate.Date;
        Status = ActivityStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        TransactionId = transactionId;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public int Quantity { get; private set; }
    public decimal UnitCost { get; private set; }
    public decimal UnitSalePrice { get; private set; }
    public DateTime StartDate { get; private set; }
    public ActivityStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid TransactionId { get; private set; }
    public Transaction Transaction { get; private set; } = null!;
    public IReadOnlyCollection<ActivityAssignment> Assignments => _assignments;

    public void EnsureQuantityAvailable(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Assigned quantity must be greater than zero.");

        var assignedQuantity = _assignments
            .Where(assignment => assignment.Status != AssignmentStatus.Cancelled)
            .Sum(assignment => assignment.QuantityAssigned);

        if (assignedQuantity + quantity > Quantity)
            throw new DomainException("The assigned quantity cannot exceed the activity quantity.");
    }

    public void Finish()
    {
        if (_assignments.Any(assignment => assignment.Status == AssignmentStatus.Pending))
            throw new DomainException("An activity cannot be finished while an assignment is pending.");

        Status = ActivityStatus.Finished;
    }
}
