using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Domain;

public class LoanPaymentTests
{
    private static LoanPayment Create(decimal amount = 100m) =>
        new(amount, DateTime.UtcNow, PaymentMethod.Cash, Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Constructor_Valid_IsPaid()
    {
        var p = Create(80m);

        Assert.Equal(PaymentStatus.Paid, p.Status);
        Assert.Equal(80m, p.Amount);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_NonPositive_Throws(double amount)
    {
        Assert.Throws<DomainException>(() => Create((decimal)amount));
    }

    [Fact]
    public void Update_Valid_ChangesAmountAndMethod()
    {
        var p = Create();

        p.Update(40m, PaymentMethod.Transfer);

        Assert.Equal(40m, p.Amount);
        Assert.Equal(PaymentMethod.Transfer, p.PaymentMethod);
    }

    [Fact]
    public void Update_InvalidAmount_Throws()
    {
        var p = Create();

        Assert.Throws<DomainException>(() => p.Update(0m, PaymentMethod.Cash));
    }

    [Fact]
    public void Update_Cancelled_Throws()
    {
        var p = Create();
        p.Cancel();

        Assert.Throws<DomainException>(() => p.Update(10m, PaymentMethod.Cash));
    }

    [Fact]
    public void Cancel_SetsCancelled_SecondTimeThrows()
    {
        var p = Create();

        p.Cancel();

        Assert.Equal(PaymentStatus.Cancelled, p.Status);
        Assert.Throws<DomainException>(p.Cancel);
    }
}

public class PerformanceTests
{
    private static Performance Create() => new(30m, "  Interes  ", Guid.NewGuid());

    [Fact]
    public void Constructor_Valid_IsPendingAndTrimmed()
    {
        var p = Create();

        Assert.Equal(PaymentStatus.Pending, p.Status);
        Assert.Equal("Interes", p.Description);
        Assert.Null(p.TransactionId);
        Assert.Null(p.PaidAt);
    }

    [Theory]
    [InlineData(0, "x")]
    [InlineData(-1, "x")]
    [InlineData(10, "")]
    [InlineData(10, "   ")]
    public void Constructor_Invalid_Throws(double amount, string description)
    {
        Assert.Throws<DomainException>(() => new Performance((decimal)amount, description, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_DescriptionOver200_Throws()
    {
        Assert.Throws<DomainException>(() => new Performance(10m, new string('a', 201), Guid.NewGuid()));
    }

    [Fact]
    public void MarkAsPaid_FromPending_SetsPaidFields()
    {
        var p = Create();
        var tx = Guid.NewGuid();

        p.MarkAsPaid(tx);

        Assert.Equal(PaymentStatus.Paid, p.Status);
        Assert.Equal(tx, p.TransactionId);
        Assert.NotNull(p.PaidAt);
    }

    [Fact]
    public void MarkAsPaid_Twice_Throws()
    {
        var p = Create();
        p.MarkAsPaid(Guid.NewGuid());

        Assert.Throws<DomainException>(() => p.MarkAsPaid(Guid.NewGuid()));
    }

    [Fact]
    public void MarkAsPaid_Cancelled_Throws()
    {
        var p = Create();
        p.Cancel();

        Assert.Throws<DomainException>(() => p.MarkAsPaid(Guid.NewGuid()));
    }

    [Fact]
    public void UpdateDetails_Pending_Changes()
    {
        var p = Create();

        p.UpdateDetails(99m, "Otro");

        Assert.Equal(99m, p.Amount);
        Assert.Equal("Otro", p.Description);
    }

    [Fact]
    public void UpdateDetails_Cancelled_Throws()
    {
        var p = Create();
        p.Cancel();

        Assert.Throws<DomainException>(() => p.UpdateDetails(1m, "x"));
    }

    [Fact]
    public void Cancel_SetsCancelled_SecondTimeThrows()
    {
        var p = Create();

        p.Cancel();

        Assert.Equal(PaymentStatus.Cancelled, p.Status);
        Assert.Throws<DomainException>(p.Cancel);
    }
}
