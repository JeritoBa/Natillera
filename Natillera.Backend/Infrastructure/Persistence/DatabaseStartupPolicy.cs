namespace Natillera.Backend.Infrastructure.Persistence;

public static class DatabaseStartupPolicy
{
    public const string ApplyMigrationsKey = "NATILLERA_APPLY_MIGRATIONS";

    // AUTH-07 / OPS-01: always in Development; elsewhere only with an explicit opt-in flag.
    public static bool ShouldApplyMigrations(string environmentName, string? applyMigrationsFlag) =>
        string.Equals(environmentName, Environments.Development, StringComparison.OrdinalIgnoreCase)
        || string.Equals(applyMigrationsFlag?.Trim(), "true", StringComparison.OrdinalIgnoreCase);
}
