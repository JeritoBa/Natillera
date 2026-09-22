using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Security;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Users;

public sealed class UserService(IUserRepository userRepository, IPasswordHasher passwordHasher)
{
    public async Task<IReadOnlyCollection<UserResponse>> GetMembersAsync(CancellationToken cancellationToken)
    {
        var members = await userRepository.GetMembersAsync(cancellationToken);
        return members.Select(AuthenticationService.ToResponse).ToArray();
    }

    public async Task<UserResponse> CreateMemberAsync(string firstName, string lastName, string email, string phone, IConfiguration configuration, CancellationToken cancellationToken)
    {
        var defaultPassword = configuration["NATILLERA_DEFAULT_MEMBER_PASSWORD"];
        if (string.IsNullOrWhiteSpace(defaultPassword) || defaultPassword.Length < 8)
            throw new InvalidOperationException("NATILLERA_DEFAULT_MEMBER_PASSWORD must contain at least 8 characters.");

        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (await userRepository.EmailExistsAsync(normalizedEmail, cancellationToken: cancellationToken))
            throw new DomainException("A user with this email already exists.");

        var member = new User(firstName, lastName, normalizedEmail, passwordHasher.Hash(defaultPassword), phone);
        await userRepository.AddAsync(member, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);
        return AuthenticationService.ToResponse(member);
    }

    public async Task<UserResponse> UpdateMemberAsync(Guid id, UpdateMemberRequest request, CancellationToken cancellationToken)
    {
        var member = await userRepository.GetMemberByIdAsync(id, cancellationToken)
            ?? throw new DomainException("Member not found.");
        var email = request.Email.Trim().ToLowerInvariant();
        if (await userRepository.EmailExistsAsync(email, id, cancellationToken))
            throw new DomainException("A user with this email already exists.");

        member.UpdateProfile(request.FirstName, request.LastName, email, request.Phone);
        await userRepository.SaveChangesAsync(cancellationToken);
        return AuthenticationService.ToResponse(member);
    }

    public async Task<UserResponse> SetMemberStatusAsync(Guid id, bool isActive, CancellationToken cancellationToken)
    {
        var member = await userRepository.GetMemberByIdAsync(id, cancellationToken)
            ?? throw new DomainException("Member not found.");
        if (isActive) member.Activate(); else member.Deactivate();
        await userRepository.SaveChangesAsync(cancellationToken);
        return AuthenticationService.ToResponse(member);
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        ValidatePassword(request.Password);
        var email = request.Email.Trim().ToLowerInvariant();

        if (await userRepository.EmailExistsAsync(email, cancellationToken: cancellationToken))
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
