using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Application;

public class CashGuardTests
{
    [Theory]
    [InlineData(1_000_000, 1_000_000)] // reaching exactly 0 is allowed
    [InlineData(1_000_000, 1)]
    [InlineData(0, 0)]
    [InlineData(-5, 0)] // no outflow: not checked even if cash is already negative
    [InlineData(10, -50)]
    public void EnsureAvailable_OutflowWithinAvailableOrNotPositive_DoesNotThrow_FIN13(decimal available, decimal outflow) =>
        CashGuard.EnsureAvailable(available, outflow);

    [Fact]
    public void EnsureAvailable_OutflowAboveAvailable_ThrowsWithInvariantFormattedMessage_FIN13()
    {
        var ex = Assert.Throws<DomainException>(() => CashGuard.EnsureAvailable(1_200_000m, 1_500_000m));

        Assert.Equal("Insufficient available money. Available: 1,200,000; required: 1,500,000.", ex.Message);
    }
}
