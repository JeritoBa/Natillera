using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Security;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Seed;

public static class AdminSeeder
{
    public static async Task SeedAsync(
        NatilleraDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var email = Required(configuration, "NATILLERA_ADMIN_EMAIL").Trim().ToLowerInvariant();
        var password = Required(configuration, "NATILLERA_ADMIN_PASSWORD");

        if (password.Length < 8)
            throw new InvalidOperationException("NATILLERA_ADMIN_PASSWORD must contain at least 8 characters.");

        if (await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken))
            return;

        var admin = new User(
            Required(configuration, "NATILLERA_ADMIN_FIRST_NAME"),
            Required(configuration, "NATILLERA_ADMIN_LAST_NAME"),
            email,
            passwordHasher.Hash(password),
            Required(configuration, "NATILLERA_ADMIN_PHONE"),
            UserRole.Admin);

        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string Required(IConfiguration configuration, string key) =>
        configuration[key] ?? throw new InvalidOperationException($"Missing required environment variable: {key}");
}
