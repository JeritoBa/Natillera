using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Security;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Users;

public sealed class UserService(IUserRepository userRepository, IPasswordHasher passwordHasher)
{
    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        ValidatePassword(request.Password);
        var email = request.Email.Trim().ToLowerInvariant();

        if (await userRepository.EmailExistsAsync(email, cancellationToken))
            throw new DomainException("A user with this email already exists.");

        var user = new User(
            request.FirstName,
            request.LastName,
            email,
            passwordHasher.Hash(request.Password),
            request.Phone,
            request.Role);

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);
        return AuthenticationService.ToResponse(user);
    }

    private static void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8 || password.Length > 128)
            throw new DomainException("Password must contain between 8 and 128 characters.");
    }
}
