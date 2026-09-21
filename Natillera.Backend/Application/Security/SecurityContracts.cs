namespace Natillera.Backend.Application.Security;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

public interface IJwtTokenGenerator
{
    JwtToken Generate(Guid userId, string email, string role);
}

public sealed record JwtToken(string AccessToken, DateTime ExpiresAt);
