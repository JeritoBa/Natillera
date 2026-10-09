using Natillera.Backend.Application.Loans;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Application;

public class LoanServiceTests
{
    private static readonly Guid Admin = Guid.NewGuid();

    private readonly FakeUserRepository _users = new();
    private readonly FakeLoanRepository _loans = new();
    private readonly FakeTransactionRepository _transactions = new();
    private readonly FakeLogRepository _logs = new();
    private readonly LoanService _service;

    public LoanServiceTests()
    {
        _service = new LoanService(_users, _loans, _transactions, _logs, new FakeUnitOfWork());
    }

    private static LoanRequest LoanReq(Guid borrower, decimal amount = 1000m, decimal rate = 5m) =>
        new() { BorrowerId = borrower, InitialAmount = amount, InterestRate = rate, StartDate = new DateTime(2025, 1, 1) };

    private static LoanPaymentRequest PayReq(decimal amount) =>
        new() { Amount = amount, PaymentMethod = PaymentMethod.Cash };

    private static InterestPaymentRequest InterestReq(PaymentStatus? status, decimal amount = 50m) =>
        new() { Amount = amount, Description = "Interes", Status = status };

    /// <summary>Creates a loan through the service and links the navigations EF would populate.</summary>
    private async Task<Loan> SeedLoanAsync(User borrower, decimal amount = 1000m)
    {
        var response = await _service.CreateLoanAsync(LoanReq(borrower.Id, amount), Admin, default);
        var loan = _loans.Loans.Single(l => l.Id == response.Id);
        loan.Set("Borrower", borrower).Set("Transaction", _transactions.Transactions.Single(t => t.Id == loan.TransactionId));
        _logs.Logs.Clear();
        return loan;
    }

    private void LinkPaymentTransactions(Loan loan)
    {
        foreach (var payment in loan.Payments)
            payment.Set("Transaction", _transactions.Transactions.Single(t => t.Id == payment.TransactionId));
        foreach (var performance in loan.Performances.Where(p => p.TransactionId is not null))
            performance.Set("Transaction", _transactions.Transactions.Single(t => t.Id == performance.TransactionId));
    }

    [Fact]
    public async Task CreateLoanAsync_Valid_CreatesExpenseTransactionAndCreateLog()
    {
        var borrower = _users.AddUser();

        var response = await _service.CreateLoanAsync(LoanReq(borrower.Id, 2500m), Admin, default);

        var tx = Assert.Single(_transactions.Transactions);
        Assert.Equal(TransactionDirection.Expense, tx.Direction);
        Assert.Equal(TransactionType.Loan, tx.Type);
        Assert.Equal(2500m, tx.Amount);
        Assert.Equal(tx.Id, response.TransactionId);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.Loan, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(2500m, log.NewValue);
    }

    [Fact]
    public async Task CreateLoanAsync_InactiveBorrower_Throws()
    {
        var borrower = _users.AddUser(active: false);

        await Assert.ThrowsAsync<DomainException>(() => _service.CreateLoanAsync(LoanReq(borrower.Id), Admin, default));
        Assert.Empty(_transactions.Transactions);
        Assert.Empty(_loans.Loans);
    }

    [Fact]
    public async Task CreateLoanAsync_UnknownBorrower_Throws()
    {
        await Assert.ThrowsAsync<DomainException>(() => _service.CreateLoanAsync(LoanReq(Guid.NewGuid()), Admin, default));
    }

    [Fact]
    public async Task CreatePaymentAsync_Valid_CreatesIncomeTransactionAndLog()
    {
        var loan = await SeedLoanAsync(_users.AddUser(), 1000m);

        var response = await _service.CreatePaymentAsync(loan.Id, PayReq(400m), Admin, default);

        Assert.Equal(400m, response.Amount);
        Assert.Equal(600m, loan.OutstandingPrincipal());
        Assert.Equal(2, _transactions.Transactions.Count);
        var tx = _transactions.Transactions.Last();
        Assert.Equal(TransactionDirection.Income, tx.Direction);
        Assert.Equal(TransactionType.LoanPayment, tx.Type);
        Assert.Equal(400m, tx.Amount);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.LoanPayment, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
        Assert.Equal(LoanStatus.Active, loan.Status);
    }

    [Fact]
    public async Task CreatePaymentAsync_FullPrincipal_MarksLoanPaid()
    {
        var loan = await SeedLoanAsync(_users.AddUser(), 1000m);

        await _service.CreatePaymentAsync(loan.Id, PayReq(1000m), Admin, default);

        Assert.Equal(LoanStatus.Paid, loan.Status);
    }

    [Fact]
    public async Task CreatePaymentAsync_ExceedsOutstanding_RejectedWithoutSideEffects()
    {
        var loan = await SeedLoanAsync(_users.AddUser(), 1000m);
        await _service.CreatePaymentAsync(loan.Id, PayReq(900m), Admin, default);
        var txCount = _transactions.Transactions.Count;
        var logCount = _logs.Logs.Count;

        await Assert.ThrowsAsync<DomainException>(() => _service.CreatePaymentAsync(loan.Id, PayReq(100.01m), Admin, default));

        Assert.Single(loan.Payments);
        Assert.Equal(logCount, _logs.Logs.Count);
        // The Transaction is only persisted inside the unit of work after RegisterPayment succeeds.
        Assert.Equal(txCount, _transactions.Transactions.Count);
    }

    [Fact]
    public async Task CreatePaymentAsync_InvalidMethod_Throws()
    {
        var loan = await SeedLoanAsync(_users.AddUser());

        await Assert.ThrowsAsync<DomainException>(() => _service.CreatePaymentAsync(
            loan.Id, new LoanPaymentRequest { Amount = 10m, PaymentMethod = null }, Admin, default));
    }

    [Fact]
    public async Task UpdatePaymentAsync_IncreaseWithinPrincipal_UpdatesPaymentAndTransaction()
    {
        var loan = await SeedLoanAsync(_users.AddUser(), 1000m);
        var created = await _service.CreatePaymentAsync(loan.Id, PayReq(400m), Admin, default);
        LinkPaymentTransactions(loan);
        _logs.Logs.Clear();

        await _service.UpdatePaymentAsync(loan.Id, created.Id, PayReq(1000m), Admin, default);

        var payment = loan.Payments.Single();
        Assert.Equal(1000m, payment.Amount);
        Assert.Equal(1000m, payment.Transaction.Amount);
        Assert.Equal(LoanStatus.Paid, loan.Status);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Update, log.Action);
        Assert.Equal(400m, log.OldValue);
        Assert.Equal(1000m, log.NewValue);
    }

    [Fact]
    public async Task UpdatePaymentAsync_ExceedsPrincipal_Throws()
    {
        var loan = await SeedLoanAsync(_users.AddUser(), 1000m);
        var created = await _service.CreatePaymentAsync(loan.Id, PayReq(400m), Admin, default);
        LinkPaymentTransactions(loan);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdatePaymentAsync(loan.Id, created.Id, PayReq(1000.01m), Admin, default));
        Assert.Equal(400m, loan.Payments.Single().Amount);
    }

    [Fact]
    public async Task CancelPaymentAsync_CancelsPaymentAndTransactionAndReopensLoan()
    {
        var loan = await SeedLoanAsync(_users.AddUser(), 1000m);
        var created = await _service.CreatePaymentAsync(loan.Id, PayReq(1000m), Admin, default);
        LinkPaymentTransactions(loan);
        _logs.Logs.Clear();

        await _service.CancelPaymentAsync(loan.Id, created.Id, Admin, default);

        var payment = loan.Payments.Single();
        Assert.Equal(PaymentStatus.Cancelled, payment.Status);
        Assert.True(payment.Transaction.IsCancelled);
        Assert.Equal(LoanStatus.Active, loan.Status);
        Assert.Equal(1000m, loan.OutstandingPrincipal());
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Delete, log.Action);
    }

    [Fact]
    public async Task CreateInterestAsync_Pending_CreatesNoTransaction()
    {
        var loan = await SeedLoanAsync(_users.AddUser());
        var before = _transactions.Transactions.Count;

        var response = await _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Pending), Admin, default);

        Assert.Equal(PaymentStatus.Pending, response.Status);
        Assert.Null(response.TransactionId);
        Assert.Equal(before, _transactions.Transactions.Count);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.Performance, log.EntityType);
        Assert.Equal(LogAction.Create, log.Action);
    }

    [Fact]
    public async Task CreateInterestAsync_Paid_CreatesIncomeTransaction()
    {
        var loan = await SeedLoanAsync(_users.AddUser());

        var response = await _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Paid, 75m), Admin, default);

        var tx = _transactions.Transactions.Last();
        Assert.Equal(TransactionDirection.Income, tx.Direction);
        Assert.Equal(TransactionType.Performance, tx.Type);
        Assert.Equal(75m, tx.Amount);
        Assert.Equal(tx.Id, response.TransactionId);
        Assert.Equal(PaymentStatus.Paid, response.Status);
    }

    [Fact]
    public async Task CreateInterestAsync_CancelledStatus_Throws()
    {
        var loan = await SeedLoanAsync(_users.AddUser());

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Cancelled), Admin, default));
    }

    [Fact]
    public async Task UpdateInterestAsync_PendingToPaid_CreatesTransactionAndLog()
    {
        var loan = await SeedLoanAsync(_users.AddUser());
        var created = await _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Pending), Admin, default);
        _logs.Logs.Clear();
        var before = _transactions.Transactions.Count;

        var response = await _service.UpdateInterestAsync(loan.Id, created.Id, InterestReq(PaymentStatus.Paid), Admin, default);

        Assert.Equal(PaymentStatus.Paid, response.Status);
        Assert.Equal(before + 1, _transactions.Transactions.Count);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogAction.Update, log.Action);
    }

    [Fact]
    public async Task UpdateInterestAsync_PaidToPending_Throws()
    {
        var loan = await SeedLoanAsync(_users.AddUser());
        var created = await _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Paid), Admin, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateInterestAsync(loan.Id, created.Id, InterestReq(PaymentStatus.Pending), Admin, default));
    }

    [Fact]
    public async Task CancelInterestAsync_Paid_CancelsTransaction()
    {
        var loan = await SeedLoanAsync(_users.AddUser());
        var created = await _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Paid), Admin, default);
        LinkPaymentTransactions(loan);
        _logs.Logs.Clear();

        await _service.CancelInterestAsync(loan.Id, created.Id, Admin, default);

        var performance = loan.Performances.Single();
        Assert.Equal(PaymentStatus.Cancelled, performance.Status);
        Assert.True(performance.Transaction!.IsCancelled);
        Assert.Equal(LogAction.Delete, Assert.Single(_logs.Logs).Action);
    }

    [Fact]
    public async Task CancelInterestAsync_Pending_CancelsWithoutTouchingOtherTransactions()
    {
        var loan = await SeedLoanAsync(_users.AddUser());
        var created = await _service.CreateInterestAsync(loan.Id, InterestReq(PaymentStatus.Pending), Admin, default);

        await _service.CancelInterestAsync(loan.Id, created.Id, Admin, default);

        Assert.Equal(PaymentStatus.Cancelled, loan.Performances.Single().Status);
        Assert.All(_transactions.Transactions, t => Assert.False(t.IsCancelled));
    }

    [Fact]
    public async Task CancelLoanAsync_WithPayments_Throws()
    {
        var loan = await SeedLoanAsync(_users.AddUser());
        await _service.CreatePaymentAsync(loan.Id, PayReq(100m), Admin, default);
        _logs.Logs.Clear();

        await Assert.ThrowsAsync<DomainException>(() => _service.CancelLoanAsync(loan.Id, Admin, default));

        Assert.Equal(LoanStatus.Active, loan.Status);
        Assert.False(loan.Transaction.IsCancelled);
        Assert.Empty(_logs.Logs);
    }

    [Fact]
    public async Task CancelLoanAsync_WithoutPayments_CancelsLoanAndTransactionAndLogs()
    {
        var loan = await SeedLoanAsync(_users.AddUser());

        await _service.CancelLoanAsync(loan.Id, Admin, default);

        Assert.Equal(LoanStatus.Cancelled, loan.Status);
        Assert.True(loan.Transaction.IsCancelled);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(LogEntityType.Loan, log.EntityType);
        Assert.Equal(LogAction.Delete, log.Action);
    }

    [Fact]
    public async Task UpdateLoanAsync_NoPayments_UpdatesLoanAndTransactionAmount()
    {
        var borrower = _users.AddUser();
        var loan = await SeedLoanAsync(borrower, 1000m);

        await _service.UpdateLoanAsync(loan.Id, LoanReq(borrower.Id, 1500m), Admin, default);

        Assert.Equal(1500m, loan.InitialAmount);
        Assert.Equal(1500m, loan.Transaction.Amount);
        var log = Assert.Single(_logs.Logs);
        Assert.Equal(1000m, log.OldValue);
        Assert.Equal(1500m, log.NewValue);
    }

    [Fact]
    public async Task UpdateLoanAsync_WithPayments_Throws()
    {
        var borrower = _users.AddUser();
        var loan = await SeedLoanAsync(borrower, 1000m);
        await _service.CreatePaymentAsync(loan.Id, PayReq(100m), Admin, default);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UpdateLoanAsync(loan.Id, LoanReq(borrower.Id, 1500m), Admin, default));
        Assert.Equal(1000m, loan.InitialAmount);
    }

    [Fact]
    public async Task CreatePaymentAsync_LoanNotFound_Throws()
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.CreatePaymentAsync(Guid.NewGuid(), PayReq(10m), Admin, default));

        Assert.Equal("Loan not found.", ex.Message);
    }
}
