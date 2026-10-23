using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class Activity
{
    private readonly List<ActivityAssignment> _assignments = [];
    private readonly List<ExtraCost> _extraCosts = [];

    private Activity()
    {
    }

    public Activity(string name, string description, int quantity, decimal unitCost, decimal unitSalePrice,
        DateTime startDate, Guid transactionId, SavingPeriod savingPeriod)
    {
        Validate(name, description, quantity, unitCost, unitSalePrice);
        savingPeriod.EnsureContains(startDate); // PER-05

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
        SavingPeriodId = savingPeriod.Id;
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
    public Guid SavingPeriodId { get; private set; }
    public SavingPeriod SavingPeriod { get; private set; } = null!;
    public Transaction Transaction { get; private set; } = null!;
    public IReadOnlyCollection<ActivityAssignment> Assignments => _assignments;
    public IReadOnlyCollection<ExtraCost> ExtraCosts => _extraCosts;

    public decimal TotalCost() => Quantity * UnitCost;

    public int AssignedQuantity() => _assignments
        .Where(assignment => assignment.Status != AssignmentStatus.Cancelled)
        .Sum(assignment => assignment.QuantityAssigned);

    public int AvailableQuantity() => Quantity - AssignedQuantity();

    public void EnsureQuantityAvailable(int quantity, int previousQuantity = 0)
    {
        EnsureNotCancelled();
        if (quantity <= 0)
            throw new DomainException("Assigned quantity must be greater than zero.");

        if (AssignedQuantity() - previousQuantity + quantity > Quantity)
            throw new DomainException("The assigned quantity cannot exceed the activity quantity.");
    }

    public void UpdateDetails(string name, string description, int quantity, decimal unitCost, decimal unitSalePrice,
        DateTime startDate, SavingPeriod savingPeriod)
    {
        EnsureNotCancelled();
        Validate(name, description, quantity, unitCost, unitSalePrice);
        if (savingPeriod.Id != SavingPeriodId)
            throw new DomainException("An activity cannot move to another saving period.");
        savingPeriod.EnsureContains(startDate); // PER-05

        if (quantity < AssignedQuantity())
            throw new DomainException("Activity quantity cannot be lower than the assigned quantity.");
        if (unitSalePrice != UnitSalePrice && _assignments.Any(assignment => assignment.Status == AssignmentStatus.Paid))
            throw new DomainException("Unit sale price cannot change because there are paid assignments.");

        Name = name.Trim();
        Description = description.Trim();
        Quantity = quantity;
        UnitCost = unitCost;
        UnitSalePrice = unitSalePrice;
        StartDate = startDate.Date;
    }

    public ActivityAssignment AddAssignment(int quantity, Guid userId)
    {
        EnsureNotCancelled();
        if (_assignments.Any(assignment => assignment.UserId == userId && assignment.Status != AssignmentStatus.Cancelled))
            throw new DomainException("Member already has an assignment in this activity.");

        EnsureQuantityAvailable(quantity);
        var assignment = new ActivityAssignment(quantity, Id, userId);
        _assignments.Add(assignment);
        return assignment;
    }

    public void UpdateAssignmentQuantity(ActivityAssignment assignment, int quantity)
    {
        EnsureQuantityAvailable(quantity, assignment.QuantityAssigned);
        assignment.UpdateQuantity(quantity);
    }

    // ACT-14, ACT-15: extra costs never touch the activity's own figures (cost, quantities, status).
    public ExtraCost AddExtraCost(string description, decimal amount)
    {
        EnsureNotCancelled();
        var cost = new ExtraCost(description, amount, Id);
        _extraCosts.Add(cost);
        return cost;
    }

    public void UpdateExtraCost(ExtraCost cost, string description, decimal amount)
    {
        EnsureNotCancelled();
        cost.UpdateDetails(description, amount);
    }

    public void Cancel()
    {
        if (Status == ActivityStatus.Cancelled)
            throw new DomainException("Activity is already cancelled.");
        if (_assignments.Any(assignment => assignment.Status != AssignmentStatus.Cancelled))
            throw new DomainException("Activity cannot be cancelled because it has active assignments.");
        if (_extraCosts.Any(cost => cost.Status != ExtraCostStatus.Cancelled))
            throw new DomainException("Activity cannot be cancelled because it has extra costs.");

        Status = ActivityStatus.Cancelled;
    }

    public void RefreshStatus()
    {
        if (Status == ActivityStatus.Cancelled) return;

        var active = _assignments.Where(assignment => assignment.Status != AssignmentStatus.Cancelled).ToArray();
        Status = AvailableQuantity() == 0 && active.All(assignment => assignment.Status == AssignmentStatus.Paid)
            ? ActivityStatus.Finished
            : ActivityStatus.Pending;
    }

    public void Finish()
    {
        if (_assignments.Any(assignment => assignment.Status == AssignmentStatus.Pending))
            throw new DomainException("An activity cannot be finished while an assignment is pending.");

        Status = ActivityStatus.Finished;
    }

    private void EnsureNotCancelled()
    {
        if (Status == ActivityStatus.Cancelled)
            throw new DomainException("Cancelled activities cannot be modified.");
    }

    private static void Validate(string name, string description, int quantity, decimal unitCost, decimal unitSalePrice)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            throw new DomainException("Activity name is required and must not exceed 100 characters.");
        if (string.IsNullOrWhiteSpace(description) || description.Length > 200)
            throw new DomainException("Activity description is required and must not exceed 200 characters.");
        if (quantity <= 0 || unitCost <= 0 || unitSalePrice <= 0)
            throw new DomainException("Activity quantities and prices must be greater than zero.");
        if (unitSalePrice < unitCost)
            throw new DomainException("Unit sale price must be greater than or equal to unit cost.");
    }
}
