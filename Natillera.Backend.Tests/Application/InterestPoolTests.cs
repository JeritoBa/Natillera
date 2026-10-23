using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Application;

public class InterestPoolTests
{
    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, 0)]
    [InlineData(250, 250)]
    public void Net_Negative_ReturnsZero_DASH12(decimal raw, decimal expected) =>
        Assert.Equal(expected, InterestPool.Net(raw));

    [Fact]
    public void Share_DividesPool_RoundsAwayFromZero_DASH06()
    {
        Assert.Equal(33.33m, InterestPool.Share(100m, 3));
        Assert.Equal(0.03m, InterestPool.Share(0.05m, 2)); // 0.025 -> 0.03, banker's rounding would give 0.02
    }

    [Fact]
    public void Share_NoMembers_Zero()
    {
        Assert.Equal(0m, InterestPool.Share(100m, 0));
    }

    [Theory]
    [InlineData(1_000, 1_000)] // using the whole pool is allowed
    [InlineData(1_000, 0)]
    [InlineData(-50, 0)] // negative raw pool, nothing to take out: not checked
    public void EnsureCovers_WithinPoolOrNoOutflow_DoesNotThrow_FIN14(decimal pool, decimal outflow) =>
        InterestPool.EnsureCovers(pool, outflow);

    [Fact]
    public void EnsureCovers_AbovePool_ThrowsWithInvariantMessage_FIN14()
    {
        var ex = Assert.Throws<DomainException>(() => InterestPool.EnsureCovers(1_200_000m, 1_500_000m));

        Assert.Equal("Insufficient shared interest pool. Available: 1,200,000; required: 1,500,000.", ex.Message);
    }

    [Fact]
    public void EnsureReductionAllowed_AbovePool_Throws_FIN14()
    {
        var ex = Assert.Throws<DomainException>(() => InterestPool.EnsureReductionAllowed(100m, 101m));

        Assert.Equal("This change would leave the shared interest pool below zero. Pool: 100; reduction: 101.", ex.Message);
    }

    [Theory]
    [InlineData(100, 100)]
    [InlineData(100, -5)]
    public void EnsureReductionAllowed_WithinPoolOrIncrease_DoesNotThrow_FIN14(decimal pool, decimal reduction) =>
        InterestPool.EnsureReductionAllowed(pool, reduction);
}
