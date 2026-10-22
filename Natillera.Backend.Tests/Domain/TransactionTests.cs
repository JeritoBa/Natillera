using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Domain;

public class TransactionTests
{
    private static Transaction Create(decimal amount = 100m) =>
        new(amount, TransactionDirection.Income, TransactionType.MonthlyPayment, "  Pago  ", Guid.NewGuid());

    [Fact]
    public void Constructor_ValidData_SetsFieldsAndTrimsDescription()
    {
        var before = DateTime.UtcNow;
        var t = Create(150.50m);

        Assert.NotEqual(Guid.Empty, t.Id);
        Assert.Equal(150.50m, t.Amount);
        Assert.Equal(TransactionDirection.Income, t.Direction);
        Assert.Equal(TransactionType.MonthlyPayment, t.Type);
        Assert.Equal("Pago", t.Description);
        Assert.False(t.IsCancelled);
        Assert.InRange(t.OccurredAt, before, DateTime.UtcNow);
    }

    [Fact]
    public void Constructor_ExplicitOccurredAt_UsesIt()
    {
        var at = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        var t = new Transaction(1m, TransactionDirection.Expense, TransactionType.Loan, "x", Guid.NewGuid(), at);

        Assert.Equal(at, t.OccurredAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.01)]
    public void Constructor_NonPositiveAmount_Throws(double amount)
    {
        Assert.Throws<DomainException>(() => Create((decimal)amount));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_BlankDescription_Throws(string description)
    {
        Assert.Throws<DomainException>(() =>
            new Transaction(1m, TransactionDirection.Income, TransactionType.Loan, description, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_DescriptionOver200_Throws()
    {
        Assert.Throws<DomainException>(() =>
            new Transaction(1m, TransactionDirection.Income, TransactionType.Loan, new string('a', 201), Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_Description200_IsAccepted()
    {
        var t = new Transaction(1m, TransactionDirection.Income, TransactionType.Loan, new string('a', 200), Guid.NewGuid());

        Assert.Equal(200, t.Description.Length);
    }

    [Fact]
    public void Update_ValidData_ChangesFields()
    {
        var t = Create();

        t.Update(55m, TransactionDirection.Expense, TransactionType.Activity, " Nuevo ");

        Assert.Equal(55m, t.Amount);
        Assert.Equal(TransactionDirection.Expense, t.Direction);
        Assert.Equal(TransactionType.Activity, t.Type);
        Assert.Equal("Nuevo", t.Description);
    }

    [Fact]
    public void Update_InvalidAmount_ThrowsAndKeepsState()
    {
        var t = Create(100m);

        Assert.Throws<DomainException>(() => t.Update(0, TransactionDirection.Income, TransactionType.Loan, "x"));
        Assert.Equal(100m, t.Amount);
    }

    [Fact]
    public void Cancel_Active_SetsIsCancelled()
    {
        var t = Create();

        t.Cancel();

        Assert.True(t.IsCancelled);
    }

    [Fact]
    public void Cancel_Twice_Throws()
    {
        var t = Create();
        t.Cancel();

        Assert.Throws<DomainException>(t.Cancel);
    }

    [Fact]
    public void Update_AfterCancel_Throws()
    {
        var t = Create();
        t.Cancel();

        var ex = Assert.Throws<DomainException>(() =>
            t.Update(5m, TransactionDirection.Income, TransactionType.Loan, "x"));
        Assert.Equal("Cancelled transactions cannot be modified.", ex.Message);
    }
}
