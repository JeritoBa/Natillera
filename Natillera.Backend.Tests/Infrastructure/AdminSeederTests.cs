using Microsoft.Extensions.Configuration;
using Natillera.Backend.Infrastructure.Persistence.Seed;

namespace Natillera.Backend.Tests.Infrastructure;

public class AdminSeederTests
{
    // The required-variable check runs before any database access, so no DbContext is needed here.
    [Theory]
    [InlineData("NATILLERA_ADMIN_EMAIL", null)]
    [InlineData("NATILLERA_ADMIN_EMAIL", "")]
    [InlineData("NATILLERA_ADMIN_EMAIL", "   ")]
    [InlineData("NATILLERA_ADMIN_PASSWORD", null)]
    [InlineData("NATILLERA_ADMIN_PASSWORD", "")]
    [InlineData("NATILLERA_ADMIN_PASSWORD", "  ")]
    public async Task SeedAsync_Throws_WhenRequiredValueIsMissingOrBlank_OPS01_AUTH07(string key, string? value)
    {
        var values = new Dictionary<string, string?>
        {
            ["NATILLERA_ADMIN_EMAIL"] = "admin@example.com",
            ["NATILLERA_ADMIN_PASSWORD"] = "password123",
            [key] = value
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            AdminSeeder.SeedAsync(null!, null!, configuration));

        Assert.Equal($"Missing required environment variable: {key}", ex.Message);
    }
}
