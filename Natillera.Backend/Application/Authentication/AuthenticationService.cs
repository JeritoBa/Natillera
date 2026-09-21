using Natillera.Backend.Application.Security;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Authentication;

public sealed class AuthenticationService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator tokenGenerator)
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            throw new DomainException("Email and password are required.");

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userRepository.GetByEmailAsync(email, cancellationToken);

        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new DomainException("Invalid email or password.");

        if (!user.IsActive)
            throw new DomainException("The user is inactive.");

        var token = tokenGenerator.Generate(user.Id, user.Email, user.Role.ToString());
        return new LoginResponse(token.AccessToken, token.ExpiresAt, ToResponse(user));
    }

    public static UserResponse ToResponse(Domain.Entities.User user) =>
        new(user.Id, user.FirstName, user.LastName, user.Email, user.Phone, user.Role, user.IsActive);
}
