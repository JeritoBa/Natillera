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
        new() { Name = "Rifa", Description = "Rifa anual", Quantity = quantity, UnitCost = cost, UnitSalePrice = price, StartDate = new DateTime(2026, 5, 5) };

    private static ActivityAssignmentRequest AssignReq(Guid userId, int quantity, AssignmentStatus? status = AssignmentStatus.Pending) =>
        new() { UserId = userId, QuantityAssigned = quantity, Status = status };

    private static ActivityAssignmentUpdateRequest UpdateReq(int quantity, AssignmentStatus? status) =>
        new() { QuantityAssigned = quantity, Status = status };

    private async Task<Activity> SeedActivityAsync(int quantity = 10, decimal cost = 1000m, decimal price = 1500m)
    {
        var response = await _service.CreateActivityAsync(ActivityReq(quantity, cost, price), Admin, TestPeriods.Y2026, default);
        var activity = _activities.Activities.Single(a => a.Id == response.Id);
        activity.Set("Transaction", _transactions.Transactions.Single(t => t.Id == activity.TransactionId));
        _logs.Logs.Clear();
        return activity;
    }

    private async Task<ActivityAssignment> SeedAssignmentAsync(Activity activity, User member, int quantity)
    {
        var response = await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, quantity), Admin, TestPeriods.Y2026, default);
        var assignment = activity.Assignments.Single(a => a.Id == response.Id);
        assignment.Set("User", member);
        _logs.Logs.Clear();
        return assignment;
    }

    private static ExtraCostRequest ExtraReq(ExtraCostStatus? status, decimal amount = 5000m, string description = "Domicilio") =>
        new() { Description = description, Amount = amount, Status = status };

    /// <summary>Seeds a paid interest (Income, Performance) so the shared interest pool of 2026 is <paramref name="pool"/>.</summary>
    private void SeedPool(decimal pool) =>
        _transactions.Transactions.Add(new Transaction(pool, TransactionDirection.Income, TransactionType.Performance, "Loan interest - QA", TestPeriods.Y2026.Id));

    private async Task<ExtraCost> SeedExtraCostAsync(Activity activity, ExtraCostStatus status, decimal amount = 5000m)
    {
        var response = await _service.CreateExtraCostAsync(activity.Id, ExtraReq(status, amount), Admin, TestPeriods.Y2026, default);
        var cost = activity.ExtraCosts.Single(c => c.Id == response.Id);
        if (cost.TransactionId is { } transactionId)
            cost.Set("Transaction", _transactions.Transactions.Single(t => t.Id == transactionId));
        _logs.Logs.Clear();
        return cost;
    }

    [Fact]
    public async Task CreateExtraCostAsync_Pending_NoTransactionOneLog()
    {
        var activity = await SeedActivityAsync();
        var transactionsBefore = _transactions.Transactions.Count;

        var response = await _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Pending), Admin, TestPeriods.Y2026, default);

        Assert.Equal(ExtraCostStatus.Pending, response.Status);
        Assert.Null(response.TransactionId);
        Assert.Equal(transactionsBefore, _transactions.Transactions.Count);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.ExtraCost, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(5000m, log.NewValue);
    }

    [Fact]
    public async Task CreateExtraCostAsync_Paid_CreatesExpenseTransactionTypeExtraCostInActivityPeriod()
    {
        var activity = await SeedActivityAsync();
        SeedPool(10_000m);

        var response = await _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Paid), Admin, TestPeriods.Y2026, default);

        var tx = _transactions.Transactions.Single(t => t.Type == TransactionType.ExtraCost);
        Assert.Equal(TransactionDirection.Expense, tx.Direction);
        Assert.Equal(5000m, tx.Amount);
        Assert.Equal(activity.SavingPeriodId, tx.SavingPeriodId);
        Assert.Equal(tx.Id, response.TransactionId);
        Assert.Equal(ExtraCostStatus.Paid, response.Status);
        Assert.NotNull(response.PaidAt);
        Assert.Equal(5000m, _transactions.SharedInterestPool());
        Assert.Single(_logs.Logs.Where(l => l.EntityType == LogEntityType.ExtraCost));
    }

    [Theory]
    [InlineData(ExtraCostStatus.Cancelled)]
    [InlineData(null)]
    public async Task CreateExtraCostAsync_StatusCancelledOrMissing_Throws(ExtraCostStatus? status)
    {
        var activity = await SeedActivityAsync();

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateExtraCostAsync(activity.Id, ExtraReq(status), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Extra cost status must be Pending or Paid.", ex.Message);
        Assert.Empty(_activities.AddedExtraCosts);
    }

    [Fact]
    public async Task CreateExtraCostAsync_PaidExceedsPool_ThrowsAndSavesNothing_FIN14()
    {
        var activity = await SeedActivityAsync();
        SeedPool(4_000m);
        var transactionsBefore = _transactions.Transactions.Count;

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Paid, 4_001m), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Insufficient shared interest pool. Available: 4,000; required: 4,001.", ex.Message);
        Assert.Empty(_activities.AddedExtraCosts);
        Assert.Equal(transactionsBefore, _transactions.Transactions.Count);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateExtraCostAsync_PaidEqualToPool_Allowed()
    {
        var activity = await SeedActivityAsync();
        SeedPool(4_000m);

        await _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Paid, 4_000m), Admin, TestPeriods.Y2026, default);

        Assert.Equal(0m, _transactions.SharedInterestPool());
    }

    [Fact]
    public async Task CreateExtraCostAsync_PaidExceedsAvailable_Throws_FIN13()
    {
        var activity = await SeedActivityAsync();
        SeedPool(10_000m);
        _transactions.SetAvailableMoney(1_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Paid, 5_000m), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Insufficient available money. Available: 1,000; required: 5,000.", ex.Message);
        Assert.Empty(_activities.AddedExtraCosts);
    }

    [Fact]
    public async Task CreateExtraCostAsync_PendingIgnoresPoolAndCash()
    {
        var activity = await SeedActivityAsync();
        _transactions.SetAvailableMoney(0m);

        await _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Pending, 999_999m), Admin, TestPeriods.Y2026, default);

        Assert.Single(_activities.AddedExtraCosts);
    }

    [Fact]
    public async Task CreateExtraCostAsync_CancelledActivity_Throws_ACT14()
    {
        var activity = await SeedActivityAsync();
        await _service.CancelActivityAsync(activity.Id, Admin, TestPeriods.Y2026, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateExtraCostAsync(activity.Id, ExtraReq(ExtraCostStatus.Pending), Admin, TestPeriods.Y2026, default));
    }

    [Fact]
    public async Task UpdateExtraCostAsync_PendingToPaid_CreatesTransaction()
    {
        var activity = await SeedActivityAsync();
        SeedPool(10_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Pending);

        var response = await _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Paid, 6_000m), Admin, TestPeriods.Y2026, default);

        var tx = _transactions.Transactions.Single(t => t.Type == TransactionType.ExtraCost);
        Assert.Equal(6_000m, tx.Amount);
        Assert.Equal(tx.Id, response.TransactionId);
        Assert.Equal(ExtraCostStatus.Paid, cost.Status);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Update, log.Action);
        Assert.Equal(5_000m, log.OldValue);
        Assert.Equal(6_000m, log.NewValue);
    }

    [Fact]
    public async Task UpdateExtraCostAsync_PendingToPaidExceedsPool_Throws_FIN14()
    {
        var activity = await SeedActivityAsync();
        SeedPool(1_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Pending);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Paid), Admin, TestPeriods.Y2026, default));

        Assert.DoesNotContain(_transactions.Transactions, t => t.Type == TransactionType.ExtraCost);
    }

    [Fact]
    public async Task UpdateExtraCostAsync_PaidToPending_Throws()
    {
        var activity = await SeedActivityAsync();
        SeedPool(10_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Paid);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Pending), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Paid extra costs cannot return to pending.", ex.Message);
    }

    [Fact]
    public async Task UpdateExtraCostAsync_PaidRaise_UsesPoolPlusPreviousAmount()
    {
        var activity = await SeedActivityAsync();
        SeedPool(5_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Paid, 3_000m); // pool left: 2,000

        await _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Paid, 5_000m), Admin, TestPeriods.Y2026, default);

        Assert.Equal(5_000m, cost.Transaction!.Amount);
        Assert.Equal(0m, _transactions.SharedInterestPool());
    }

    [Fact]
    public async Task UpdateExtraCostAsync_PaidRaiseBeyondPool_Throws_FIN14()
    {
        var activity = await SeedActivityAsync();
        SeedPool(5_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Paid, 3_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Paid, 5_001m), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Insufficient shared interest pool. Available: 2,000; required: 2,001.", ex.Message);
        Assert.Equal(3_000m, cost.Transaction!.Amount);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task UpdateExtraCostAsync_PaidLower_UpdatesTransactionNoGuard()
    {
        var activity = await SeedActivityAsync();
        SeedPool(3_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Paid, 3_000m); // pool 0
        _transactions.SetAvailableMoney(0m);

        await _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Paid, 1_000m, "Otro"), Admin, TestPeriods.Y2026, default);

        Assert.Equal(1_000m, cost.Transaction!.Amount);
        Assert.Equal(1_000m, cost.Amount);
        Assert.Equal("Otro", cost.Description);
    }

    [Fact]
    public async Task UpdateExtraCostAsync_OtherPeriod_NotFound()
    {
        var activity = await SeedActivityAsync();
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Pending);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateExtraCostAsync(activity.Id, cost.Id, ExtraReq(ExtraCostStatus.Pending), Admin, TestPeriods.Y2025, default));

        Assert.Equal("Activity not found.", ex.Message);
    }

    [Fact]
    public async Task UpdateExtraCostAsync_UnknownCost_NotFound()
    {
        var activity = await SeedActivityAsync();

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateExtraCostAsync(activity.Id, Guid.NewGuid(), ExtraReq(ExtraCostStatus.Pending), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Extra cost not found.", ex.Message);
    }

    [Fact]
    public async Task CancelExtraCostAsync_Paid_CancelsTransactionOneLog()
    {
        var activity = await SeedActivityAsync();
        SeedPool(10_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Paid);

        await _service.CancelExtraCostAsync(activity.Id, cost.Id, Admin, TestPeriods.Y2026, default);

        Assert.Equal(ExtraCostStatus.Cancelled, cost.Status);
        Assert.True(cost.Transaction!.IsCancelled);
        Assert.Equal(10_000m, _transactions.SharedInterestPool());
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Delete, log.Action);
        Assert.Equal(5_000m, log.OldValue);
        Assert.Null(log.NewValue);
    }

    [Fact]
    public async Task CancelExtraCostAsync_Pending_DoesNotCancelAnyTransaction()
    {
        var activity = await SeedActivityAsync();
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Pending);

        await _service.CancelExtraCostAsync(activity.Id, cost.Id, Admin, TestPeriods.Y2026, default);

        Assert.Equal(ExtraCostStatus.Cancelled, cost.Status);
        Assert.All(_transactions.Transactions, t => Assert.False(t.IsCancelled));
    }

    [Fact]
    public async Task CancelExtraCostAsync_AlwaysAllowedEvenWhenPoolZero_FIN14()
    {
        var activity = await SeedActivityAsync();
        SeedPool(5_000m);
        var cost = await SeedExtraCostAsync(activity, ExtraCostStatus.Paid, 5_000m); // pool 0
        _transactions.SetAvailableMoney(-1m);

        await _service.CancelExtraCostAsync(activity.Id, cost.Id, Admin, TestPeriods.Y2026, default);

        Assert.True(cost.Transaction!.IsCancelled);
    }

    [Fact]
    public async Task CancelActivityAsync_WithExtraCosts_Throws_ACT14()
    {
        var activity = await SeedActivityAsync();
        await SeedExtraCostAsync(activity, ExtraCostStatus.Pending);

        await Assert.ThrowsAsync<DomainException>(() => _service.CancelActivityAsync(activity.Id, Admin, TestPeriods.Y2026, default));
        Assert.Equal(ActivityStatus.Pending, activity.Status);
    }

    [Fact]
    public async Task CreateActivityAsync_Valid_CreatesExpenseTransactionOfQuantityTimesCost()
    {
        var response = await _service.CreateActivityAsync(ActivityReq(12, 2500m, 3000m), Admin, TestPeriods.Y2026, default);

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
            _service.CreateActivityAsync(ActivityReq(5, 2000m, 1000m), Admin, TestPeriods.Y2026, default));

        Assert.Empty(_transactions.Transactions);
        Assert.Empty(_activities.Activities);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateAssignmentAsync_Valid_CreatesNoTransactionAndLogsAssignment()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();

        var response = await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 4), Admin, TestPeriods.Y2026, default);

        Assert.Single(_transactions.Transactions); // only the activity expense
        Assert.Equal(AssignmentStatus.Pending, response.Status);
        Assert.Equal(6000m, response.SaleAmount);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.ActivityAssignment, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(response.Id, log.EntityId);
    }

    [Fact]
    public async Task CreateAssignmentAsync_Paid_CreatesIncomeTransactionAndPaidAt_ACT16()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();

        var response = await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 4, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);

        Assert.Equal(AssignmentStatus.Paid, response.Status);
        Assert.NotNull(response.PaidAt);
        Assert.Equal(2, _transactions.Transactions.Count); // activity expense + sale income
        var sale = _transactions.Transactions.Single(t => t.Type == TransactionType.ActivitySale);
        Assert.Equal(TransactionDirection.Income, sale.Direction);
        Assert.Equal(6000m, sale.Amount);
        Assert.Equal(TestPeriods.Y2026.Id, sale.SavingPeriodId);
        Assert.Equal(sale.Id, activity.Assignments.Single().TransactionId);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(6000m, log.NewValue);
    }

    [Fact]
    public async Task CreateAssignmentAsync_Pending_CreatesNoTransaction_ACT16()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();

        var response = await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 4), Admin, TestPeriods.Y2026, default);

        Assert.Null(response.PaidAt);
        Assert.DoesNotContain(_transactions.Transactions, t => t.Type == TransactionType.ActivitySale);
        Assert.Single(_logs.Logs);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(AssignmentStatus.Cancelled)]
    public async Task CreateAssignmentAsync_InvalidStatus_Throws_ACT16(AssignmentStatus? status)
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 2, status), Admin, TestPeriods.Y2026, default));

        Assert.Empty(activity.Assignments);
        Assert.Single(_transactions.Transactions);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateAssignmentAsync_PaidCoversAllUnits_FinishesActivity_ACT10()
    {
        var activity = await SeedActivityAsync(5);
        var member = _users.AddUser();

        await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 5, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);

        Assert.Equal(ActivityStatus.Finished, activity.Status);
    }

    [Fact]
    public async Task UpdateActivityAsync_ChangePriceAfterPaidCreation_Throws_ACT05()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        await _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 2, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateActivityAsync(activity.Id, ActivityReq(10, 1000m, 2000m), Admin, TestPeriods.Y2026, default));
    }

    [Fact]
    public async Task CreateAssignmentAsync_SameMemberTwice_Throws()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        await SeedAssignmentAsync(activity, member, 2);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 1), Admin, TestPeriods.Y2026, default));
        Assert.Single(activity.Assignments);
    }

    [Fact]
    public async Task CreateAssignmentAsync_ExceedsAvailable_Throws()
    {
        var activity = await SeedActivityAsync(5);
        var member = _users.AddUser();

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 6), Admin, TestPeriods.Y2026, default));
        Assert.Empty(activity.Assignments);
    }

    [Fact]
    public async Task CreateAssignmentAsync_InactiveMember_Throws()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser(active: false);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAssignmentAsync(activity.Id, AssignReq(member.Id, 1), Admin, TestPeriods.Y2026, default));
    }

    [Fact]
    public async Task UpdateAssignmentAsync_MarkPaid_CreatesIncomeOfQuantityTimesPrice()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);

        var response = await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);

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

        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(5, AssignmentStatus.Pending), Admin, TestPeriods.Y2026, default);

        Assert.Equal(5, assignment.QuantityAssigned);
        Assert.Equal(before, _transactions.Transactions.Count);
    }

    [Fact]
    public async Task UpdateAssignmentAsync_PaidToPending_Throws()
    {
        var activity = await SeedActivityAsync();
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);
        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Pending), Admin, TestPeriods.Y2026, default));
    }

    [Fact]
    public async Task UpdateAssignmentAsync_AllSoldAndPaid_FinishesActivity()
    {
        var activity = await SeedActivityAsync(3);
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);

        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);

        Assert.Equal(ActivityStatus.Finished, activity.Status);
    }

    [Fact]
    public async Task CancelAssignmentAsync_Paid_CancelsItsTransactionAndReopensActivity()
    {
        var activity = await SeedActivityAsync(3);
        var member = _users.AddUser();
        var assignment = await SeedAssignmentAsync(activity, member, 3);
        await _service.UpdateAssignmentAsync(activity.Id, assignment.Id, UpdateReq(3, AssignmentStatus.Paid), Admin, TestPeriods.Y2026, default);
        var saleTx = _transactions.Transactions.Last();
        assignment.Set("Transaction", saleTx);
        _logs.Logs.Clear();

        await _service.CancelAssignmentAsync(activity.Id, assignment.Id, Admin, TestPeriods.Y2026, default);

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

        await _service.CancelAssignmentAsync(activity.Id, assignment.Id, Admin, TestPeriods.Y2026, default);

        Assert.Equal(AssignmentStatus.Cancelled, assignment.Status);
        Assert.All(_transactions.Transactions, t => Assert.False(t.IsCancelled));
    }

    [Fact]
    public async Task CancelActivityAsync_WithoutAssignments_CancelsActivityAndExpense()
    {
        var activity = await SeedActivityAsync(10, 1000m);

        await _service.CancelActivityAsync(activity.Id, Admin, TestPeriods.Y2026, default);

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

        await Assert.ThrowsAsync<DomainException>(() => _service.CancelActivityAsync(activity.Id, Admin, TestPeriods.Y2026, default));
        Assert.False(activity.Transaction.IsCancelled);
    }

    [Fact]
    public async Task UpdateActivityAsync_ChangesQuantity_UpdatesExpenseTransactionAmount()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);

        await _service.UpdateActivityAsync(activity.Id, ActivityReq(20, 1000m, 1500m), Admin, TestPeriods.Y2026, default);

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
            _service.CreateAssignmentAsync(Guid.NewGuid(), AssignReq(member.Id, 1), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Activity not found.", ex.Message);
    }

    // ---- FIN-13: available money check ----

    [Fact]
    public async Task CreateActivityAsync_OutflowAboveAvailable_ThrowsAndSavesNothing_FIN13()
    {
        _transactions.SetAvailableMoney(100_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateActivityAsync(ActivityReq(10, 20_000m, 30_000m), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Insufficient available money. Available: 100,000; required: 200,000.", ex.Message);
        Assert.Empty(_transactions.Transactions);
        Assert.Empty(_activities.Activities);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateActivityAsync_OutflowEqualsAvailable_Succeeds_FIN13()
    {
        _transactions.SetAvailableMoney(200_000m);

        await _service.CreateActivityAsync(ActivityReq(10, 20_000m, 30_000m), Admin, TestPeriods.Y2026, default);

        Assert.Equal(0m, _transactions.Available());
        Assert.Single(_logs.Logs);
    }

    [Fact]
    public async Task UpdateActivityAsync_IncreaseAboveAvailable_Throws_FIN13()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        _transactions.SetAvailableMoney(5_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateActivityAsync(activity.Id, ActivityReq(20, 1000m, 1500m), Admin, TestPeriods.Y2026, default));

        Assert.Equal("Insufficient available money. Available: 5,000; required: 10,000.", ex.Message);
        Assert.Equal(10_000m, activity.Transaction.Amount);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task UpdateActivityAsync_Decrease_SkipsCheckWithZeroCash_FIN13()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        _transactions.SetAvailableMoney(0m);

        await _service.UpdateActivityAsync(activity.Id, ActivityReq(5, 1000m, 1500m), Admin, TestPeriods.Y2026, default);

        Assert.Equal(5_000m, activity.Transaction.Amount);
    }

    [Fact]
    public async Task CancelActivityAsync_IsNotCheckedWhenCashGoesNegative_FIN13()
    {
        var activity = await SeedActivityAsync(10, 1000m, 1500m);
        _transactions.SetAvailableMoney(-1m);

        await _service.CancelActivityAsync(activity.Id, Admin, TestPeriods.Y2026, default);

        Assert.True(activity.Transaction.IsCancelled);
    }
}
