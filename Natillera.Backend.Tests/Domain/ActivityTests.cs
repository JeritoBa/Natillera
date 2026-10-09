using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Domain;

public class ActivityTests
{
    private static Activity Create(int quantity = 10, decimal cost = 1000m, decimal price = 1500m) =>
        new("Rifa", "Rifa anual", quantity, cost, price, new DateTime(2025, 5, 5, 8, 0, 0), Guid.NewGuid());

    [Fact]
    public void Constructor_Valid_SetsFieldsAndTotals()
    {
        var a = Create(10, 1000m, 1500m);

        Assert.Equal(ActivityStatus.Pending, a.Status);
        Assert.Equal(new DateTime(2025, 5, 5), a.StartDate);
        Assert.Equal(10_000m, a.TotalCost());
        Assert.Equal(0, a.AssignedQuantity());
        Assert.Equal(10, a.AvailableQuantity());
    }

    [Theory]
    [InlineData(0, 10, 20)]
    [InlineData(-1, 10, 20)]
    [InlineData(5, 0, 20)]
    [InlineData(5, 10, 0)]
    [InlineData(5, 20, 10)]
    public void Constructor_InvalidNumbers_Throws(int quantity, double cost, double price)
    {
        Assert.Throws<DomainException>(() => Create(quantity, (decimal)cost, (decimal)price));
    }

    [Fact]
    public void Constructor_PriceEqualToCost_IsAccepted()
    {
        var a = Create(1, 100m, 100m);

        Assert.Equal(100m, a.UnitSalePrice);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Constructor_BlankName_Throws(string name)
    {
        Assert.Throws<DomainException>(() => new Activity(name, "d", 1, 1m, 1m, DateTime.UtcNow, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_NameOver100_Throws()
    {
        Assert.Throws<DomainException>(() =>
            new Activity(new string('a', 101), "d", 1, 1m, 1m, DateTime.UtcNow, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_BlankOrLongDescription_Throws()
    {
        Assert.Throws<DomainException>(() => new Activity("n", " ", 1, 1m, 1m, DateTime.UtcNow, Guid.NewGuid()));
        Assert.Throws<DomainException>(() =>
            new Activity("n", new string('a', 201), 1, 1m, 1m, DateTime.UtcNow, Guid.NewGuid()));
    }

    [Fact]
    public void AddAssignment_Valid_ReducesAvailable()
    {
        var a = Create(10);

        var assignment = a.AddAssignment(4, Guid.NewGuid());

        Assert.Equal(AssignmentStatus.Pending, assignment.Status);
        Assert.Equal(4, a.AssignedQuantity());
        Assert.Equal(6, a.AvailableQuantity());
    }

    [Fact]
    public void AddAssignment_SameMemberActive_Throws()
    {
        var a = Create(10);
        var user = Guid.NewGuid();
        a.AddAssignment(2, user);

        Assert.Throws<DomainException>(() => a.AddAssignment(1, user));
    }

    [Fact]
    public void AddAssignment_SameMemberAfterCancel_IsAllowed()
    {
        var a = Create(10);
        var user = Guid.NewGuid();
        a.AddAssignment(2, user).Cancel();

        var again = a.AddAssignment(3, user);

        Assert.Equal(3, again.QuantityAssigned);
        Assert.Equal(3, a.AssignedQuantity());
    }

    [Fact]
    public void AddAssignment_ExceedsAvailable_Throws()
    {
        var a = Create(10);
        a.AddAssignment(8, Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.AddAssignment(3, Guid.NewGuid()));
        Assert.Equal(8, a.AssignedQuantity());
    }

    [Fact]
    public void AddAssignment_ExactlyAvailable_IsAllowed()
    {
        var a = Create(10);
        a.AddAssignment(8, Guid.NewGuid());

        a.AddAssignment(2, Guid.NewGuid());

        Assert.Equal(0, a.AvailableQuantity());
    }

    [Fact]
    public void AddAssignment_ZeroQuantity_Throws()
    {
        var a = Create(10);

        Assert.Throws<DomainException>(() => a.AddAssignment(0, Guid.NewGuid()));
    }

    [Fact]
    public void AddAssignment_CancelledActivity_Throws()
    {
        var a = Create();
        a.Cancel();

        Assert.Throws<DomainException>(() => a.AddAssignment(1, Guid.NewGuid()));
    }

    [Fact]
    public void AssignedQuantity_IgnoresCancelledAssignments()
    {
        var a = Create(10);
        a.AddAssignment(4, Guid.NewGuid());
        a.AddAssignment(3, Guid.NewGuid()).Cancel();

        Assert.Equal(4, a.AssignedQuantity());
        Assert.Equal(6, a.AvailableQuantity());
    }

    [Fact]
    public void UpdateAssignmentQuantity_WithinAvailable_Updates()
    {
        var a = Create(10);
        var assignment = a.AddAssignment(4, Guid.NewGuid());
        a.AddAssignment(3, Guid.NewGuid());

        a.UpdateAssignmentQuantity(assignment, 7);

        Assert.Equal(7, assignment.QuantityAssigned);
        Assert.Equal(0, a.AvailableQuantity());
    }

    [Fact]
    public void UpdateAssignmentQuantity_Exceeds_Throws()
    {
        var a = Create(10);
        var assignment = a.AddAssignment(4, Guid.NewGuid());
        a.AddAssignment(3, Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.UpdateAssignmentQuantity(assignment, 8));
        Assert.Equal(4, assignment.QuantityAssigned);
    }

    [Fact]
    public void UpdateAssignmentQuantity_PaidAssignment_Throws()
    {
        var a = Create(10);
        var assignment = a.AddAssignment(4, Guid.NewGuid());
        assignment.MarkAsPaid(Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.UpdateAssignmentQuantity(assignment, 5));
    }

    [Fact]
    public void UpdateDetails_Valid_ChangesFields()
    {
        var a = Create(10);

        a.UpdateDetails(" Nueva ", "Desc", 12, 900m, 1800m, new DateTime(2025, 6, 1, 5, 0, 0));

        Assert.Equal("Nueva", a.Name);
        Assert.Equal(12, a.Quantity);
        Assert.Equal(900m, a.UnitCost);
        Assert.Equal(1800m, a.UnitSalePrice);
        Assert.Equal(new DateTime(2025, 6, 1), a.StartDate);
    }

    [Fact]
    public void UpdateDetails_QuantityBelowAssigned_Throws()
    {
        var a = Create(10);
        a.AddAssignment(6, Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.UpdateDetails("n", "d", 5, 1000m, 1500m, DateTime.UtcNow));
        Assert.Equal(10, a.Quantity);
    }

    [Fact]
    public void UpdateDetails_QuantityEqualToAssigned_IsAllowed()
    {
        var a = Create(10);
        a.AddAssignment(6, Guid.NewGuid());

        a.UpdateDetails("n", "d", 6, 1000m, 1500m, DateTime.UtcNow);

        Assert.Equal(6, a.Quantity);
    }

    [Fact]
    public void UpdateDetails_SalePriceChangeWithPaidAssignment_Throws()
    {
        var a = Create(10);
        a.AddAssignment(2, Guid.NewGuid()).MarkAsPaid(Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.UpdateDetails("n", "d", 10, 1000m, 2000m, DateTime.UtcNow));
        Assert.Equal(1500m, a.UnitSalePrice);
    }

    [Fact]
    public void UpdateDetails_SamePriceWithPaidAssignment_IsAllowed()
    {
        var a = Create(10);
        a.AddAssignment(2, Guid.NewGuid()).MarkAsPaid(Guid.NewGuid());

        a.UpdateDetails("n", "d", 10, 800m, 1500m, DateTime.UtcNow);

        Assert.Equal(800m, a.UnitCost);
    }

    [Fact]
    public void UpdateDetails_SalePriceChangeWithOnlyPendingAssignment_IsAllowed()
    {
        var a = Create(10);
        a.AddAssignment(2, Guid.NewGuid());

        a.UpdateDetails("n", "d", 10, 1000m, 2000m, DateTime.UtcNow);

        Assert.Equal(2000m, a.UnitSalePrice);
    }

    [Fact]
    public void UpdateDetails_Cancelled_Throws()
    {
        var a = Create();
        a.Cancel();

        Assert.Throws<DomainException>(() => a.UpdateDetails("n", "d", 1, 1m, 1m, DateTime.UtcNow));
    }

    [Fact]
    public void UpdateDetails_PriceBelowCost_Throws()
    {
        var a = Create();

        Assert.Throws<DomainException>(() => a.UpdateDetails("n", "d", 10, 2000m, 1000m, DateTime.UtcNow));
    }

    [Fact]
    public void Cancel_NoAssignments_Cancels()
    {
        var a = Create();

        a.Cancel();

        Assert.Equal(ActivityStatus.Cancelled, a.Status);
    }

    [Fact]
    public void Cancel_WithActiveAssignment_Throws()
    {
        var a = Create();
        a.AddAssignment(1, Guid.NewGuid());

        Assert.Throws<DomainException>(a.Cancel);
        Assert.Equal(ActivityStatus.Pending, a.Status);
    }

    [Fact]
    public void Cancel_WithOnlyCancelledAssignments_Succeeds()
    {
        var a = Create();
        a.AddAssignment(1, Guid.NewGuid()).Cancel();

        a.Cancel();

        Assert.Equal(ActivityStatus.Cancelled, a.Status);
    }

    [Fact]
    public void Cancel_Twice_Throws()
    {
        var a = Create();
        a.Cancel();

        Assert.Throws<DomainException>(a.Cancel);
    }

    [Fact]
    public void RefreshStatus_AllQuantityAssignedAndPaid_Finishes()
    {
        var a = Create(5);
        a.AddAssignment(3, Guid.NewGuid()).MarkAsPaid(Guid.NewGuid());
        a.AddAssignment(2, Guid.NewGuid()).MarkAsPaid(Guid.NewGuid());

        a.RefreshStatus();

        Assert.Equal(ActivityStatus.Finished, a.Status);
    }

    [Fact]
    public void RefreshStatus_AvailableQuantityRemaining_StaysPending()
    {
        var a = Create(5);
        a.AddAssignment(3, Guid.NewGuid()).MarkAsPaid(Guid.NewGuid());

        a.RefreshStatus();

        Assert.Equal(ActivityStatus.Pending, a.Status);
    }

    [Fact]
    public void RefreshStatus_NoAssignmentsAtAll_IsPending()
    {
        var a = Create(5);

        a.RefreshStatus();

        Assert.Equal(ActivityStatus.Pending, a.Status);
    }

    [Fact]
    public void RefreshStatus_FullyAssignedWithPendingOne_IsPending()
    {
        var a = Create(5);
        a.AddAssignment(3, Guid.NewGuid()).MarkAsPaid(Guid.NewGuid());
        a.AddAssignment(2, Guid.NewGuid());

        a.RefreshStatus();

        Assert.Equal(ActivityStatus.Pending, a.Status);
    }

    [Fact]
    public void RefreshStatus_FinishedThenPaidAssignmentCancelled_ReturnsToPending()
    {
        var a = Create(5);
        var assignment = a.AddAssignment(5, Guid.NewGuid());
        assignment.MarkAsPaid(Guid.NewGuid());
        a.RefreshStatus();
        Assert.Equal(ActivityStatus.Finished, a.Status);

        assignment.Cancel();
        a.RefreshStatus();

        Assert.Equal(ActivityStatus.Pending, a.Status);
    }

    [Fact]
    public void RefreshStatus_Cancelled_RemainsCancelled()
    {
        var a = Create(5);
        a.Cancel();

        a.RefreshStatus();

        Assert.Equal(ActivityStatus.Cancelled, a.Status);
    }

    [Fact]
    public void Finish_WithPendingAssignment_Throws()
    {
        var a = Create(5);
        a.AddAssignment(1, Guid.NewGuid());

        Assert.Throws<DomainException>(a.Finish);
    }
}

public class ActivityAssignmentTests
{
    private static ActivityAssignment Create(int quantity = 3) => new(quantity, Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Constructor_Valid_IsPending()
    {
        var a = Create(3);

        Assert.Equal(AssignmentStatus.Pending, a.Status);
        Assert.Equal(3, a.QuantityAssigned);
        Assert.Null(a.TransactionId);
        Assert.Null(a.PaidAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-2)]
    public void Constructor_NonPositiveQuantity_Throws(int quantity)
    {
        Assert.Throws<DomainException>(() => Create(quantity));
    }

    [Fact]
    public void MarkAsPaid_FromPending_SetsFields()
    {
        var a = Create();
        var tx = Guid.NewGuid();

        a.MarkAsPaid(tx);

        Assert.Equal(AssignmentStatus.Paid, a.Status);
        Assert.Equal(tx, a.TransactionId);
        Assert.NotNull(a.PaidAt);
    }

    [Fact]
    public void MarkAsPaid_Twice_Throws()
    {
        var a = Create();
        a.MarkAsPaid(Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.MarkAsPaid(Guid.NewGuid()));
    }

    [Fact]
    public void UpdateQuantity_Pending_Updates()
    {
        var a = Create();

        a.UpdateQuantity(9);

        Assert.Equal(9, a.QuantityAssigned);
    }

    [Fact]
    public void UpdateQuantity_Paid_Throws()
    {
        var a = Create();
        a.MarkAsPaid(Guid.NewGuid());

        Assert.Throws<DomainException>(() => a.UpdateQuantity(5));
    }

    [Fact]
    public void UpdateQuantity_Cancelled_Throws()
    {
        var a = Create();
        a.Cancel();

        Assert.Throws<DomainException>(() => a.UpdateQuantity(5));
    }

    [Fact]
    public void UpdateQuantity_Zero_Throws()
    {
        var a = Create();

        Assert.Throws<DomainException>(() => a.UpdateQuantity(0));
    }

    [Fact]
    public void Cancel_Twice_Throws()
    {
        var a = Create();
        a.Cancel();

        Assert.Equal(AssignmentStatus.Cancelled, a.Status);
        Assert.Throws<DomainException>(a.Cancel);
    }

    [Fact]
    public void Cancel_Paid_IsAllowed()
    {
        var a = Create();
        a.MarkAsPaid(Guid.NewGuid());

        a.Cancel();

        Assert.Equal(AssignmentStatus.Cancelled, a.Status);
    }
}
