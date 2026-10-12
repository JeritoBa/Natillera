using Natillera.Backend.Application.Activities;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Application;

public class ActivityServiceTests
{
    private static readonly Guid Admin = Guid.NewGuid();
    private const decimal Cash = 1_000_000_000m;

    private readonly FakeUserRepository _users = new();
    private readonly FakeActivityRepository _activities = new();
    private readonly FakeTransactionRepository _transactions = new();
    private readonly FakeLogRepository _logs = new();
    private readonly ActivityService _service;

    public ActivityServiceTests()
    {
        _service = new ActivityService(_users, _activities, _transactions, _logs, new FakeUnitOfWork());
        _transactions.SetAvailableMoney(Cash); // FIN-13: default cash so seeding loans/activities is allowed
    }

    private static ActivityRequest ActivityReq(int quantity = 10, decimal cost = 1000m, decimal price = 1500m) =>
        new() { Name = "Rifa", Description = "Rifa anual", Quantity = quantity, UnitCost = cost, UnitSalePrice = price, StartDate = new DateTime(2025, 5, 5) };

    private static ActivityAssignmentRequest AssignReq(Guid userId, int quantity) =>
        new() { UserId = userId, QuantityAssigned = quantity };

    private static ActivityAssignmentUpdateRequest UpdateReq(int quantity, AssignmentStatus? status) =>
        new() { QuantityAssigned = quantity, Status = status };

    private async Task<Activity> SeedActivityAsync(int quantity = 10, decimal cost = 1000m, decimal price = 1500m)
    {
        var response = await _service.CreateActivityAsync(ActivityReq(quantity, cost, price), Admin, default);
        var activity = _activities.Activities.Single(a => a.Id == response.Id);
        activity.Set("Transaction", _transactions.Transactions.Single(t => t.Id == activity.TransactionId));
        _logs.Logs.Clear();
        return activity;
    }

    private async Task<ActivityAssignment> SeedAssignmentAsync(Activity activity, User member, int quantity)
    {
        var response = await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, quantity), Admin, default);
        var assignment = activity.Assignments.Single(a => a.Id == response.Id);
        assignment.Set("User", member);
        _logs.Logs.Clear();
        return assignment;
    }

    [Fact]
    public async Task CreateActivityAsync_Valid_CreatesExpenseTransactionOfQuantityTimesCost()
    {
        var response = await _service.CreateActivityAsync(ActivityReq(12, 2500m, 3000m), Admin, default);

        var tx = Assert.Single(_transactions.Transactions);
        Assert.Equal(TransactionDirection.Expense, tx.Direction);
        Assert.Equal(TransactionType.Activity, tx.Type);
        Assert.Equal(30_000m, tx.Amount);
        Assert.Equal(tx.Id, response.TransactionId);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.Activity, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(30_000m, log.NewValue);
        Assert.Equal(Admin, log.UserId);
    }

    [Fact]
    public async Task CreateActivityAsync_PriceBelowCost_ThrowsWithoutPersisting()
    {
        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateActivityAsync(ActivityReq(5, 2000m, 1000m), Admin, default));

        Assert.Empty(_transactions.Transactions);
        Assert.Empty(_activities.Activities);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateAssignmentAsync_Valid_CreatesNoTransactionAndLogsAssignment()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();

        var response = await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 4), Admin, default);

        Assert.Single(_transactions.Transactions); // only the activity expense
        Assert.Equal(AssignmentStatus.Pending, response.Status);
        Assert.Equal(6000m, response.SaleAmount);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.ActivityAssignment, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(response.Id, log.EntityId);
    }

    [Fact]
    public async Task CreateAssignmentAsync_SameMemberTwice_Throws()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        await SeedAssignmentAsync(activity, member, 2);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 1), Admin, default));
        Assert.Single(activity.Assignments);
    }

    [Fact]
    public async Task CreateAssignmentAsync_ExceedsAvailable_Throws()
    {
        var activity = await SeedActivityAsync(5);
        var member = _users.AddUser();

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 6), Admin, default));
        Assert.Empty(activity.Assignments);
    }

    [Fact]
    public async Task CreateAssignmentAsync_InactiveMember_Throws()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser(active: false);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 1), Admin, default));
    }

    [Fact]
    public async Task UpdateAssignmentAsync_MarkPaid_CreatesIncomeOfQuantityTimesPrice()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);

        var response = await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, default);

        var tx = _transactions.Transactions.Last();
        Assert.Equal(TransactionDirection.Income, tx.Direction);
        Assert.Equal(TransactionType.ActivitySale, tx.Type);
        Assert.Equal(4500m, tx.Amount);
        Assert.Equal(AssignmentStatus.Paid, response.Status);
        Assert.Equal(tx.Id, response.TransactionId);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Update, log.Action);
        Assert.Equal(4500m, log.OldValue);
        Assert.Equal(4500m, log.NewValue);
    }

    [Fact]
    public async Task UpdateAssignmentAsync_ChangeQuantityStayingPending_CreatesNoTransaction()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);
        var before = _transactions.Transactions.Count;

        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(5, AssignmentStatus.Pending), Admin, default);

        Assert.Equal(5, assignment.QuantityAssigned);
        Assert.Equal(before, _transactions.Transactions.Count);
    }

    [Fact]
    public async Task UpdateAssignmentAsync_PaidToPending_Throws()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);
        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Pending), Admin, default));
    }

    [Fact]
    public async Task UpdateAssignmentAsync_AllSoldAndPaid_FinishesActivity()
    {
        var activity = await SeedActivityAsync(3);
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);

        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, default);

        Assert.Equal(ActivityStatus.Finished, activity.Status);
    }

    [Fact]
    public async Task CancelAssignmentAsync_Paid_CancelsItsTransactionAndReopensActivity()
    {
        var activity = await SeedActivityAsync(3);
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);
        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, default);
        var saleTx = _transactions.Transactions.Last();
        assignment.Set("Transaction", saleTx);
        _logs.Logs.Clear();

        await _service.CancelAssignmentAsync(activity.Id, assignment.Id, Admin, default);

        Assert.Equal(AssignmentStatus.Cancelled, assignment.Status);
        Assert.True(saleTx.IsCancelled);
        Assert.Equal(ActivityStatus.Pending, activity.Status);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Delete, log.Action);
        Assert.Equal(LogEntityType.ActivityAssignment, log.EntityType);
        Assert.Equal(saleTx.Amount, log.OldValue);
    }

    [Fact]
    public async Task CancelAssignmentAsync_Pending_DoesNotCancelAnyTransaction()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 2);

        await _service.CancelAssignmentAsync(activity.Id, assignment.Id, Admin, default);

        Assert.Equal(AssignmentStatus.Cancelled, assignment.Status);
        Assert.All(_transactions.Transactions, t => Assert.False(t.IsCancelled));
    }

    [Fact]
    public async Task CancelActivityAsync_WithoutAssignments_CancelsActivityAndExpense()
    {
        var activity = await SeedActivityAsync(10, 1000m);

        await _service.CancelActivityAsync(activity.Id, Admin, default);

        Assert.Equal(ActivityStatus.Cancelled, activity.Status);
        Assert.True(activity.Transaction.IsCancelled);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Delete, log.Action);
        Assert.Equal(10_000m, log.OldValue);
    }

    [Fact]
    public async Task CancelActivityAsync_WithActiveAssignments_Throws()
    {
        var activity = await SeedActivityAsync();
        await SeedAssignmentAsync(activity, _users.AddUser(), 1);

        await Assert.ThrowsAsync<DomainException>(() => _service.CancelActivityAsync(activity.Id, Admin, default));
        Assert.False(activity.Transaction.IsCancelled);
    }

    [Fact]
    public async Task UpdateActivityAsync_ChangesQuantity_UpdatesExpenseTransactionAmount()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);

        await _service.UpdateActivityAsync(activity.Id, ActivityReq(20, 1000m, 1500m), Admin, default);

        Assert.Equal(20_000m, activity.Transaction.Amount);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(10_000m, log.OldValue);
        Assert.Equal(20_000m, log.NewValue);
    }

    [Fact]
    public async Task CreateAssignmentAsync_ActivityNotFound_Throws()
    {
        var member = _users.AddUser();

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(Guid.NewGuid(), AssignReq(member.Id, 1), Admin, default));

        Assert.Equal("Activity not found.", ex.Message);
    }

    // ---- FIN-13: available money check ----

    [Fact]
    public async Task CreateActivityAsync_OutflowAboveAvailable_ThrowsAndSavesNothing_FIN13()
    {
        _transactions.SetAvailableMoney(100_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateActivityAsync(ActivityReq(10, 20_000m, 30_000m), Admin, default));

        Assert.Equal("Insufficient available money. Available: 100,000; required: 200,000.", ex.Message);
        Assert.Empty(_transactions.Transactions);
        Assert.Empty(_activities.Activities);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateActivityAsync_OutflowEqualsAvailable_Succeeds_FIN13()
    {
        _transactions.SetAvailableMoney(200_000m);

        await _service.CreateActivityAsync(ActivityReq(10, 20_000m, 30_000m), Admin, default);

        Assert.Equal(0m, _transactions.Available());
        Assert.Single(_logs.Logs);
    }

    [Fact]
    public async Task UpdateActivityAsync_IncreaseAboveAvailable_Throws_FIN13()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        _transactions.SetAvailableMoney(5_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateActivityAsync(activity.Id, ActivityReq(20, 1000m, 1500m), Admin, default));

        Assert.Equal("Insufficient available money. Available: 5,000; required: 10,000.", ex.Message);
        Assert.Equal(10_000m, activity.Transaction.Amount);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task UpdateActivityAsync_Decrease_SkipsCheckWithZeroCash_FIN13()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        _transactions.SetAvailableMoney(0m);

        await _service.UpdateActivityAsync(activity.Id, ActivityReq(5, 1000m, 1500m), Admin, default);

        Assert.Equal(5_000m, activity.Transaction.Amount);
    }

    [Fact]
    public async Task CancelActivityAsync_IsNotCheckedWhenCashGoesNegative_FIN13()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        _transactions.SetAvailableMoney(-1m);

        await _service.CancelActivityAsync(activity.Id, Admin, default);

        Assert.True(activity.Transaction.IsCancelled);
    }
}
