using Natillera.Backend.Infrastructure.Persistence;

namespace Natillera.Backend.Tests.Infrastructure;

public class DatabaseStartupPolicyTests
{
    [Theory]
    [InlineData("Development", null)]
    [InlineData("Development", "false")]
    [InlineData("Development", "")]
    [InlineData("development", null)]
    [InlineData("Staging", "true")]
    [InlineData("Production", "true")]
    [InlineData("Production", "TRUE")]
    [InlineData("Production", "True")]
    [InlineData("Production", " true ")]
    public void ShouldApplyMigrations_ReturnsTrue_AUTH07_OPS01(string environment, string? flag) =>
        Assert.True(DatabaseStartupPolicy.ShouldApplyMigrations(environment, flag));

    [Theory]
    [InlineData("Production", null)]
    [InlineData("Production", "")]
    [InlineData("Production", "false")]
    [InlineData("Production", "1")]
    [InlineData("Production", "yes")]
    [InlineData("Production", "truee")]
    [InlineData("Staging", null)]
    public void ShouldApplyMigrations_ReturnsFalse_AUTH07_OPS01(string environment, string? flag) =>
        Assert.False(DatabaseStartupPolicy.ShouldApplyMigrations(environment, flag));
}
