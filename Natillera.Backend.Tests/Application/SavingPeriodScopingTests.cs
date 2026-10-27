using Natillera.Backend.Application.Activities;
using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Loans;
using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Application.SavingPeriods;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Application;

public class MonthlyPaymentSavingPeriodTests
{
    private static readonly Guid Admin = Guid.NewGuid();

    private readonly FakeUserRepository _users = new();
    private readonly FakeMonthlyPaymentRepository _payments = new();
    private readonly FakeTransactionRepository _transactions = new();
    private readonly FakeLogRepository _logs = new();
    private readonly MonthlyPaymentService _service;

    public MonthlyPaymentSavingPeriodTests()
    {
        _service = new MonthlyPaymentService(_users, _payments, _transactions, _logs, new FakeUnitOfWork(), new MonthlyPaymentOptions(10_000m));
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2026.Id);
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2025.Id);
    }

    private static CreateMonthlyPaymentRequest CreateRequest(Guid userId, PaymentStatus status, int month = 3) =>
        new() { UserId = userId, Month = month, Amount = 50_000m, Status = status };

    [Fact]
    public async Task CreateAsync_SameMonthOtherPeriod_Allowed_MP04()
    {
        var member = _users.AddUser();

        await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, TestPeriods.Y2026, default);
        await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, TestPeriods.Y2025, default);

        Assert.Equal(2, _payments.Payments.Count);
        Assert.Equal(2, _payments.Payments.Select(p => p.SavingPeriodId).Distinct().Count());
    }

    [Fact]
    public async Task CreateAsync_DuplicateInPeriod_Throws_MP04()
    {
        var member = _users.AddUser();
        await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, TestPeriods.Y2025, default);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Paid), Admin, TestPeriods.Y2025, default));

        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ResponseYearIsPeriodYear_MP11()
    {
        var member = _users.AddUser();

        var response = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, TestPeriods.Y2025, default);

        Assert.Equal(2025, response.Year);
    }

    [Fact]
    public async Task CreateAsync_PaidTransactionAndLogGetFeePeriod_PER02()
    {
        var member = _users.AddUser();

        await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Paid), Admin, TestPeriods.Y2025, default);

        Assert.Equal(TestPeriods.Y2025.Id, Assert.Single(_transactions.Transactions).SavingPeriodId);
        Assert.Equal(TestPeriods.Y2025.Id, Assert.Single(_logs.Logs).SavingPeriodId);
        Assert.Equal(TestPeriods.Y2025.Id, Assert.Single(_payments.Payments).SavingPeriodId);
    }

    [Fact]
    public async Task UpdateAsync_OtherPeriod_ThrowsNotFound_PER06()
    {
        var member = _users.AddUser();
        var created = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, TestPeriods.Y2026, default);
        var update = new UpdateMonthlyPaymentRequest { UserId = member.Id, Month = 4, Amount = 50_000m, Status = PaymentStatus.Pending };

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(created.Id, update, Admin, TestPeriods.Y2025, default));

        Assert.Contains("not found", ex.Message);
    }

    [Fact]
    public async Task CancelAsync_OtherPeriod_ThrowsNotFound_PER06()
    {
        var member = _users.AddUser();
        var created = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, TestPeriods.Y2026, default);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CancelAsync(created.Id, Admin, TestPeriods.Y2025, default));

        Assert.Contains("not found", ex.Message);
    }
}

public class LoanSavingPeriodTests
{
    private static readonly Guid Admin = Guid.NewGuid();

    private readonly FakeUserRepository _users = new();
    private readonly FakeLoanRepository _loans = new();
    private readonly FakeTransactionRepository _transactions = new();
    private readonly FakeLogRepository _logs = new();
    private readonly LoanService _service;

    public LoanSavingPeriodTests()
    {
        _service = new LoanService(_users, _loans, _transactions, _logs, new FakeUnitOfWork());
    }

    private static LoanRequest LoanReq(Guid borrower, decimal amount, int year) =>
        new() { BorrowerId = borrower, InitialAmount = amount, InterestRate = 5m, StartDate = new DateTime(year, 3, 1) };

    [Fact]
    public async Task CreatePaymentAsync_TransactionAndLogGetLoanPeriod_PER02()
    {
        var borrower = _users.AddUser();
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2025.Id);
        var created = await _service.CreateLoanAsync(LoanReq(borrower.Id, 1000m, 2025), Admin, TestPeriods.Y2025, default);
        _loans.Loans.Single().Set("Borrower", borrower);
        _logs.Logs.Clear();
        _transactions.Transactions.Clear();

        await _service.CreatePaymentAsync(created.Id,
            new LoanPaymentRequest { Amount = 100m, PaymentMethod = PaymentMethod.Cash }, Admin, TestPeriods.Y2025, default);

        Assert.Equal(TestPeriods.Y2025.Id, Assert.Single(_transactions.Transactions).SavingPeriodId);
        Assert.Equal(TestPeriods.Y2025.Id, Assert.Single(_logs.Logs).SavingPeriodId);
    }

    [Fact]
    public async Task CreateLoanAsync_UsesAvailableMoneyOfPeriodOnly_FIN13_PER06()
    {
        var borrower = _users.AddUser();
        _transactions.SetAvailableMoney(100m, TestPeriods.Y2026.Id);
        _transactions.SetAvailableMoney(0m, TestPeriods.Y2025.Id);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateLoanAsync(LoanReq(borrower.Id, 50m, 2025), Admin, TestPeriods.Y2025, default));
        Assert.Empty(_loans.Loans);

        var ok = await _service.CreateLoanAsync(LoanReq(borrower.Id, 50m, 2026), Admin, TestPeriods.Y2026, default);
        Assert.Equal(TestPeriods.Y2026.Id, _loans.Loans.Single(l => l.Id == ok.Id).SavingPeriodId);
    }

    [Fact]
    public async Task CreateLoanAsync_StartDateOutsidePeriod_Throws_PER05()
    {
        var borrower = _users.AddUser();
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2026.Id);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateLoanAsync(LoanReq(borrower.Id, 50m, 2025), Admin, TestPeriods.Y2026, default));
        Assert.Empty(_loans.Loans);
    }

    [Fact]
    public async Task UpdateLoanAsync_UsesRecordPeriodCash_FIN13()
    {
        var borrower = _users.AddUser();
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2026.Id);
        _transactions.SetAvailableMoney(1_000m, TestPeriods.Y2025.Id);
        var created = await _service.CreateLoanAsync(LoanReq(borrower.Id, 100m, 2025), Admin, TestPeriods.Y2025, default);
        var loan = _loans.Loans.Single();
        loan.Set("Borrower", borrower).Set("Transaction", _transactions.Transactions.Single());
        _transactions.SetAvailableMoney(50m, TestPeriods.Y2025.Id);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateLoanAsync(created.Id, LoanReq(borrower.Id, 200m, 2025), Admin, TestPeriods.Y2025, default));
    }

    [Fact]
    public async Task GetDetailAsync_OtherPeriod_ReturnsNull_PER06()
    {
        var borrower = _users.AddUser();
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2026.Id);
        var created = await _service.CreateLoanAsync(LoanReq(borrower.Id, 100m, 2026), Admin, TestPeriods.Y2026, default);
        _loans.Loans.Single().Set("Borrower", borrower);

        Assert.NotNull(await _service.GetDetailAsync(created.Id, TestPeriods.Y2026, default));
        Assert.Null(await _service.GetDetailAsync(created.Id, TestPeriods.Y2025, default));
        Assert.Null(await _service.GetPaymentAsync(created.Id, Guid.NewGuid(), TestPeriods.Y2025, default));
    }

    [Fact]
    public async Task UpdateLoanAsync_OtherPeriod_ThrowsNotFound_PER06()
    {
        var borrower = _users.AddUser();
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2026.Id);
        var created = await _service.CreateLoanAsync(LoanReq(borrower.Id, 100m, 2026), Admin, TestPeriods.Y2026, default);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateLoanAsync(created.Id, LoanReq(borrower.Id, 100m, 2025), Admin, TestPeriods.Y2025, default));

        Assert.Contains("not found", ex.Message);
    }
}

public class ActivitySavingPeriodTests
{
    private static readonly Guid Admin = Guid.NewGuid();

    private readonly FakeUserRepository _users = new();
    private readonly FakeActivityRepository _activities = new();
    private readonly FakeTransactionRepository _transactions = new();
    private readonly FakeLogRepository _logs = new();
    private readonly ActivityService _service;

    public ActivitySavingPeriodTests()
    {
        _service = new ActivityService(_users, _activities, _transactions, _logs, new FakeUnitOfWork());
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2025.Id);
        _transactions.SetAvailableMoney(1_000_000m, TestPeriods.Y2026.Id);
    }

    private static ActivityRequest ActivityReq(int year) =>
        new() { Name = "Rifa", Description = "Rifa anual", Quantity = 10, UnitCost = 1000m, UnitSalePrice = 1500m, StartDate = new DateTime(year, 5, 5) };

    [Fact]
    public async Task CreateAssignmentAsync_ChildGetsActivityPeriod_PER02()
    {
        var member = _users.AddUser();
        var created = await _service.CreateActivityAsync(ActivityReq(2025), Admin, TestPeriods.Y2025, default);
        var activity = _activities.Activities.Single();
        activity.Set("Transaction", _transactions.Transactions.Single());
        _logs.Logs.Clear();

        var assignment = await _service.CreateAssignmentAsync(created.Id,
            new ActivityAssignmentRequest { UserId = member.Id, QuantityAssigned = 2, Status = AssignmentStatus.Pending }, Admin, TestPeriods.Y2025, default);
        activity.Assignments.Single().Set("User", member);
        await _service.UpdateAssignmentAsync(created.Id, assignment.Id,
            new ActivityAssignmentUpdateRequest { QuantityAssigned = 2, Status = AssignmentStatus.Paid }, Admin, TestPeriods.Y2025, default);

        Assert.Equal(2, _logs.Logs.Count);
        Assert.All(_logs.Logs, log => Assert.Equal(TestPeriods.Y2025.Id, log.SavingPeriodId));
        var sale = _transactions.Transactions.Single(t => t.Type == TransactionType.ActivitySale);
        Assert.Equal(TestPeriods.Y2025.Id, sale.SavingPeriodId);
    }

    [Fact]
    public async Task GetDetailAsync_OtherPeriod_ReturnsNull_PER06()
    {
        var created = await _service.CreateActivityAsync(ActivityReq(2026), Admin, TestPeriods.Y2026, default);

        Assert.Null(await _service.GetDetailAsync(created.Id, TestPeriods.Y2025, default));
        Assert.Null(await _service.GetAssignmentAsync(created.Id, Guid.NewGuid(), TestPeriods.Y2025, default));
    }

    [Fact]
    public async Task CreateActivityAsync_UsesAvailableMoneyOfPeriodOnly_FIN13_PER06()
    {
        _transactions.SetAvailableMoney(0m, TestPeriods.Y2025.Id);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateActivityAsync(ActivityReq(2025), Admin, TestPeriods.Y2025, default));
        Assert.Empty(_activities.Activities);
    }

    [Fact]
    public async Task CreateActivityAsync_StartDateOutsidePeriod_Throws_PER05()
    {
        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateActivityAsync(ActivityReq(2025), Admin, TestPeriods.Y2026, default));
        Assert.Empty(_activities.Activities);
    }
}

public class SavingPeriodServiceTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsNewestFirst_PER03()
    {
        var service = new SavingPeriodService(new FakeSavingPeriodRepository());

        var result = await service.GetAllAsync(default);

        Assert.Equal([2026, 2025], result.Select(p => p.Year));
    }
}

public class UserServiceSavingPeriodTests
{
    [Fact]
    public async Task SetMemberStatusAsync_PendingInOtherPeriod_BlocksDeactivation_MEM04_PER07()
    {
        // MEM-04 takes no period: the repository counts obligations of every period, so a fee pending only in an
        // old period still blocks. The fake stands for that unfiltered count.
        var users = new FakeUserRepository();
        var member = users.AddUser();
        users.Pending = new MemberPendingObligations(1, 0, 0, 0);
        var service = new UserService(users, new FakePasswordHasher());

        await Assert.ThrowsAsync<DomainException>(() => service.SetMemberStatusAsync(member.Id, false, default));

        Assert.True(member.IsActive);
    }
}
