using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Application;

public class MonthlyPaymentServiceTests
{
    private const decimal Minimum = 10_000m;
    private const decimal Cash = 1_000_000_000m;
    private static readonly Guid Admin = Guid.NewGuid();

    private readonly FakeUserRepository _users = new();
    private readonly FakeMonthlyPaymentRepository _payments = new();
    private readonly FakeTransactionRepository _transactions = new();
    private readonly FakeLogRepository _logs = new();
    private readonly FakeUnitOfWork _uow = new();
    private readonly MonthlyPaymentService _service;

    public MonthlyPaymentServiceTests()
    {
        _service = new MonthlyPaymentService(_users, _payments, _transactions, _logs, _uow, new MonthlyPaymentOptions(Minimum));
        _transactions.SetAvailableMoney(Cash); // FIN-13: default cash
    }

    private static CreateMonthlyPaymentRequest CreateRequest(Guid userId, PaymentStatus? status, decimal amount = 50_000m,
        int year = 2025, int month = 6) =>
        new() { UserId = userId, Year = year, Month = month, Amount = amount, Status = status };

    private static UpdateMonthlyPaymentRequest UpdateRequest(Guid userId, PaymentStatus? status, decimal amount = 50_000m,
        int year = 2025, int month = 6) =>
        new() { UserId = userId, Year = year, Month = month, Amount = amount, Status = status };

    /// <summary>Mimics the EF navigation fix-up that links a payment to its Transaction.</summary>
    private void LinkTransaction(MonthlyPayment payment)
    {
        var tx = _transactions.Transactions.Single(t => t.Id == payment.TransactionId);
        payment.Set("Transaction", tx);
    }

    private async Task<MonthlyPayment> SeedAsync(Guid userId, PaymentStatus status)
    {
        var response = await _service.CreateAsync(CreateRequest(userId, status), Admin, default);
        var payment = _payments.Payments.Single(p => p.Id == response.Id);
        if (payment.TransactionId is not null) LinkTransaction(payment);
        _logs.Logs.Clear();
        return payment;
    }

    [Fact]
    public async Task CreateAsync_Pending_DoesNotCreateTransactionAndWritesOneCreateLog()
    {
        var member = _users.AddUser();

        var response = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, default);

        Assert.Equal(PaymentStatus.Pending, response.Status);
        Assert.Null(response.TransactionId);
        Assert.Empty(_transactions.Transactions);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.MonthlyPayment, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(response.Id, log.EntityId);
        Assert.Equal(Admin, log.UserId);
        Assert.Null(log.OldValue);
        Assert.Equal(50_000m, log.NewValue);
        Assert.Equal("Juan Perez", response.MemberName);
    }

    [Fact]
    public async Task CreateAsync_Paid_CreatesIncomeTransactionAndLinksIt()
    {
        var member = _users.AddUser();

        var response = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Paid), Admin, default);

        var tx = Assert.Single(_transactions.Transactions);
        Assert.Equal(TransactionDirection.Income, tx.Direction);
        Assert.Equal(TransactionType.MonthlyPayment, tx.Type);
        Assert.Equal(50_000m, tx.Amount);
        Assert.Equal(tx.Id, response.TransactionId);
        Assert.Equal(PaymentStatus.Paid, response.Status);
        Assert.NotNull(response.PaidAt);
        Assert.Single(_logs.Logs);
    }

    [Fact]
    public async Task CreateAsync_BelowMinimum_Throws()
    {
        var member = _users.AddUser();

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending, Minimum - 0.01m), Admin, default));

        Assert.Contains("at least", ex.Message);
        Assert.Empty(_payments.Payments);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CreateAsync_ExactlyMinimum_IsAccepted()
    {
        var member = _users.AddUser();

        var response = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending, Minimum), Admin, default);

        Assert.Equal(Minimum, response.Amount);
    }

    [Fact]
    public async Task CreateAsync_InactiveMember_Throws()
    {
        var member = _users.AddUser(active: false);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, default));
        Assert.Empty(_payments.Payments);
    }

    [Fact]
    public async Task CreateAsync_UnknownMember_Throws()
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(Guid.NewGuid(), PaymentStatus.Pending), Admin, default));

        Assert.Equal("Member not found.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_DuplicatePeriod_Throws()
    {
        var member = _users.AddUser();
        await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, default));
        Assert.Single(_payments.Payments);
    }

    [Fact]
    public async Task CreateAsync_SamePeriodAfterCancellation_CreatesNewPayment()
    {
        var member = _users.AddUser();
        var cancelled = await SeedAsync(member.Id, PaymentStatus.Pending);
        await _service.CancelAsync(cancelled.Id, Admin, default);

        var response = await _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, default);

        Assert.NotEqual(cancelled.Id, response.Id);
        Assert.Equal(2, _payments.Payments.Count);
        Assert.Equal(PaymentStatus.Cancelled, cancelled.Status);
    }

    [Fact]
    public async Task CreateAsync_SamePeriodWithNonCancelledPayment_ThrowsDuplicate()
    {
        var member = _users.AddUser();
        await SeedAsync(member.Id, PaymentStatus.Paid);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(member.Id, PaymentStatus.Pending), Admin, default));

        Assert.Equal("A monthly payment already exists for this member and period.", ex.Message);
        Assert.Single(_payments.Payments);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(PaymentStatus.Cancelled)]
    public async Task CreateAsync_InvalidRequestedStatus_Throws(PaymentStatus? status)
    {
        var member = _users.AddUser();

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateAsync(CreateRequest(member.Id, status), Admin, default));
    }

    [Fact]
    public async Task UpdateAsync_PendingToPaid_CreatesTransaction()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);

        var response = await _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Paid), Admin, default);

        var tx = Assert.Single(_transactions.Transactions);
        Assert.Equal(TransactionDirection.Income, tx.Direction);
        Assert.Equal(PaymentStatus.Paid, response.Status);
        Assert.Equal(tx.Id, response.TransactionId);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Update, log.Action);
        Assert.Equal(50_000m, log.OldValue);
    }

    [Fact]
    public async Task UpdateAsync_PendingToPaidWithLiveTransaction_ReusesItWithoutCreatingAnother()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);
        var existing = new Transaction(50_000m, TransactionDirection.Income, TransactionType.MonthlyPayment, "old");
        payment.Set("Transaction", existing);

        var response = await _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Paid, 60_000m), Admin, default);

        Assert.Empty(_transactions.Transactions);
        Assert.Equal(existing.Id, response.TransactionId);
        Assert.Equal(60_000m, existing.Amount);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
    }

    [Fact]
    public async Task UpdateAsync_PendingToPaidWithCancelledTransaction_Throws()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);
        var existing = new Transaction(50_000m, TransactionDirection.Income, TransactionType.MonthlyPayment, "old");
        existing.Cancel();
        payment.Set("Transaction", existing);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Paid), Admin, default));
        Assert.Equal(PaymentStatus.Pending, payment.Status);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task UpdateAsync_PaidToPending_Throws()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Pending), Admin, default));

        Assert.Equal("Paid monthly payment cannot return to pending.", ex.Message);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
    }

    [Fact]
    public async Task UpdateAsync_PaidWithNewAmount_UpdatesTransactionAmount()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);

        await _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Paid, 70_000m), Admin, default);

        Assert.Equal(70_000m, payment.Amount);
        Assert.Equal(70_000m, payment.Transaction!.Amount);
        Assert.Single(_transactions.Transactions);
    }

    [Fact]
    public async Task UpdateAsync_Cancelled_Throws()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);
        payment.Cancel();

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Pending), Admin, default));
    }

    [Fact]
    public async Task UpdateAsync_BelowMinimum_Throws()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Pending, 1m), Admin, default));
        Assert.Equal(50_000m, payment.Amount);
    }

    [Fact]
    public async Task UpdateAsync_InactiveMember_Throws()
    {
        var member = _users.AddUser();
        var other = _users.AddUser(active: false, email: "otro@test.com");
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(payment.Id, UpdateRequest(other.Id, PaymentStatus.Pending), Admin, default));
    }

    [Fact]
    public async Task UpdateAsync_NotFound_Throws()
    {
        var member = _users.AddUser();

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(Guid.NewGuid(), UpdateRequest(member.Id, PaymentStatus.Pending), Admin, default));

        Assert.Equal("Monthly payment not found.", ex.Message);
    }

    [Fact]
    public async Task CancelAsync_Paid_CancelsPaymentAndTransactionAndWritesDeleteLog()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);

        await _service.CancelAsync(payment.Id, Admin, default);

        Assert.Equal(PaymentStatus.Cancelled, payment.Status);
        Assert.True(payment.Transaction!.IsCancelled);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Delete, log.Action);
        Assert.Equal(LogEntityType.MonthlyPayment, log.EntityType);
        Assert.Equal(50_000m, log.OldValue);
        Assert.Null(log.NewValue);
    }

    [Fact]
    public async Task CancelAsync_PendingWithLiveTransaction_AlsoCancelsTransaction()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);
        var existing = new Transaction(50_000m, TransactionDirection.Income, TransactionType.MonthlyPayment, "old");
        payment.Set("Transaction", existing);

        await _service.CancelAsync(payment.Id, Admin, default);

        Assert.True(existing.IsCancelled);
        Assert.Equal(PaymentStatus.Cancelled, payment.Status);
    }

    [Fact]
    public async Task CancelAsync_PendingWithoutTransaction_JustCancels()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);

        await _service.CancelAsync(payment.Id, Admin, default);

        Assert.Equal(PaymentStatus.Cancelled, payment.Status);
        Assert.Single(_logs.Logs);
    }

    [Fact]
    public async Task CancelAsync_Twice_Throws()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);
        await _service.CancelAsync(payment.Id, Admin, default);

        await Assert.ThrowsAsync<DomainException>(() => _service.CancelAsync(payment.Id, Admin, default));
        Assert.Single(_logs.Logs);
    }

    [Fact]
    public async Task CancelAsync_NotFound_Throws()
    {
        await Assert.ThrowsAsync<DomainException>(() => _service.CancelAsync(Guid.NewGuid(), Admin, default));
    }

    // ---- FIN-13: available money check ----

    [Fact]
    public async Task UpdateAsync_PaidDecreaseAboveAvailable_Throws_FIN13()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);
        _transactions.SetAvailableMoney(20_000m);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Paid, 20_000m), Admin, default));

        Assert.Equal("Insufficient available money. Available: 20,000; required: 30,000.", ex.Message);
        Assert.Equal(50_000m, payment.Transaction!.Amount);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task UpdateAsync_PaidIncreaseWithZeroCash_Succeeds_FIN13()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);
        _transactions.SetAvailableMoney(0m);

        await _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Paid, 70_000m), Admin, default);

        Assert.Equal(70_000m, payment.Transaction!.Amount);
    }

    [Fact]
    public async Task UpdateAsync_PendingEditWithZeroCash_SkipsCheck_FIN13()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Pending);
        _transactions.SetAvailableMoney(0m);

        await _service.UpdateAsync(payment.Id, UpdateRequest(member.Id, PaymentStatus.Pending, 20_000m), Admin, default);

        Assert.Equal(20_000m, payment.Amount);
    }

    [Fact]
    public async Task CancelAsync_Paid_IsNotCheckedWhenCashGoesNegative_FIN13()
    {
        var member = _users.AddUser();
        var payment = await SeedAsync(member.Id, PaymentStatus.Paid);
        _transactions.SetAvailableMoney(10_000m);

        await _service.CancelAsync(payment.Id, Admin, default);

        Assert.True(payment.Transaction!.IsCancelled);
        Assert.True(_transactions.Available() < 0m);
    }
}
