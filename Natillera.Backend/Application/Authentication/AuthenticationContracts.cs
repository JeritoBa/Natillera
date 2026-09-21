using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Authentication;

public sealed record LoginRequest(string Email, string Password);

public sealed record LoginResponse(string AccessToken, DateTime ExpiresAt, UserResponse User);

public sealed record UserResponse(Guid Id, string FirstName, string LastName, string Email, string Phone,
    UserRole Role, bool IsActive);
