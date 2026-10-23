using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Domain;

public class ExtraCostTests
{
    private static ExtraCost Create(decimal amount = 5000m) => new("  Domicilio  ", amount, Guid.NewGuid());

    [Fact]
    public void Constructor_Valid_IsPendingWithoutTransaction_ACT13()
    {
        var cost = Create();

        Assert.Equal(ExtraCostStatus.Pending, cost.Status);
        Assert.Equal("Domicilio", cost.Description);
        Assert.Equal(5000m, cost.Amount);
        Assert.Null(cost.TransactionId);
        Assert.Null(cost.PaidAt);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_EmptyDescription_Throws(string description)
    {
        Assert.Throws<DomainException>(() => new ExtraCost(description, 1m, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_DescriptionOver200_Throws()
    {
        Assert.Throws<DomainException>(() => new ExtraCost(new string('a', 201), 1m, Guid.NewGuid()));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_ZeroOrNegativeAmount_Throws(int amount)
    {
        Assert.Throws<DomainException>(() => new ExtraCost("Domicilio", amount, Guid.NewGuid()));
    }

    [Fact]
    public void MarkAsPaid_Pending_SetsPaidAtAndTransaction_FIN08()
    {
        var cost = Create();
        var transactionId = Guid.NewGuid();

        cost.MarkAsPaid(transactionId);

        Assert.Equal(ExtraCostStatus.Paid, cost.Status);
        Assert.NotNull(cost.PaidAt);
        Assert.Equal(transactionId, cost.TransactionId);
    }

    [Fact]
    public void MarkAsPaid_Paid_Throws()
    {
        var cost = Create();
        cost.MarkAsPaid(Guid.NewGuid());

        Assert.Throws<DomainException>(() => cost.MarkAsPaid(Guid.NewGuid()));
    }

    [Fact]
    public void UpdateDetails_Cancelled_Throws_FIN07()
    {
        var cost = Create();
        cost.Cancel();

        Assert.Throws<DomainException>(() => cost.UpdateDetails("Otro", 1m));
    }

    [Fact]
    public void Cancel_Twice_Throws_FIN07()
    {
        var cost = Create();
        cost.Cancel();

        Assert.Throws<DomainException>(cost.Cancel);
    }
}
