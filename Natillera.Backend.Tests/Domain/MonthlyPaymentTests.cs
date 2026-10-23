using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Domain;

public class MonthlyPaymentTests
{
    private static MonthlyPayment Create() => new(50000m, 6, Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Constructor_Valid_IsPendingWithoutTransactionOrPaidAt()
    {
        var userId = Guid.NewGuid();
        var periodId = Guid.NewGuid();

        var p = new MonthlyPayment(50000m, 6, userId, periodId);

        Assert.Equal(PaymentStatus.Pending, p.Status);
        Assert.Null(p.TransactionId);
        Assert.Null(p.PaidAt);
        Assert.Equal(50000m, p.Amount);
        Assert.Equal(6, p.Month);
        Assert.Equal(userId, p.UserId);
        Assert.Equal(periodId, p.SavingPeriodId);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Constructor_NonPositiveAmount_Throws(double amount)
    {
        Assert.Throws<DomainException>(() => new MonthlyPayment((decimal)amount, 6, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    [InlineData(-1)]
    public void Constructor_InvalidMonth_Throws(int month)
    {
        Assert.Throws<DomainException>(() => new MonthlyPayment(10m, month, Guid.NewGuid(), Guid.NewGuid()));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(12)]
    public void Constructor_BoundaryMonths_Accepted(int month)
    {
        var p = new MonthlyPayment(10m, month, Guid.NewGuid(), Guid.NewGuid());

        Assert.Equal(month, p.Month);
    }

    [Fact]
    public void MarkAsPaid_FromPending_SetsPaidAtAndTransaction()
    {
        var p = Create();
        var txId = Guid.NewGuid();
        var before = DateTime.UtcNow;

        p.MarkAsPaid(txId);

        Assert.Equal(PaymentStatus.Paid, p.Status);
        Assert.Equal(txId, p.TransactionId);
        Assert.NotNull(p.PaidAt);
        Assert.InRange(p.PaidAt!.Value, before, DateTime.UtcNow);
    }

    [Fact]
    public void MarkAsPaid_AlreadyPaid_Throws()
    {
        var p = Create();
        var first = Guid.NewGuid();
        p.MarkAsPaid(first);

        Assert.Throws<DomainException>(() => p.MarkAsPaid(Guid.NewGuid()));
        Assert.Equal(first, p.TransactionId);
    }

    [Fact]
    public void MarkAsPaid_Cancelled_Throws()
    {
        var p = Create();
        p.Cancel();

        Assert.Throws<DomainException>(() => p.MarkAsPaid(Guid.NewGuid()));
    }

    [Fact]
    public void UpdateDetails_Pending_ChangesValues()
    {
        var p = Create();
        var newUser = Guid.NewGuid();

        p.UpdateDetails(70000m, 1, newUser);

        Assert.Equal(70000m, p.Amount);
        Assert.Equal(1, p.Month);
        Assert.Equal(newUser, p.UserId);
    }

    [Fact]
    public void UpdateDetails_Cancelled_Throws()
    {
        var p = Create();
        p.Cancel();

        Assert.Throws<DomainException>(() => p.UpdateDetails(1m, 1, Guid.NewGuid()));
    }

    [Fact]
    public void UpdateDetails_InvalidAmount_ThrowsAndKeepsState()
    {
        var p = Create();

        Assert.Throws<DomainException>(() => p.UpdateDetails(0m, 1, Guid.NewGuid()));
        Assert.Equal(50000m, p.Amount);
    }

    [Fact]
    public void Cancel_Pending_SetsCancelled()
    {
        var p = Create();

        p.Cancel();

        Assert.Equal(PaymentStatus.Cancelled, p.Status);
    }

    [Fact]
    public void Cancel_Twice_Throws()
    {
        var p = Create();
        p.Cancel();

        Assert.Throws<DomainException>(p.Cancel);
    }
}
