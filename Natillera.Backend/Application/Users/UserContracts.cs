using System.ComponentModel.DataAnnotations;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Users;

public sealed class CreateMemberRequest
{
    [Required, MaxLength(45)]
    public string FirstName { get; init; } = string.Empty;

    [Required, MaxLength(45)]
    public string LastName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(10)]
    public string Phone { get; init; } = string.Empty;
}

public sealed class CreateUserRequest
{
    [Required, MaxLength(45)]
    public string FirstName { get; init; } = string.Empty;

    [Required, MaxLength(45)]
    public string LastName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string Password { get; init; } = string.Empty;

    [Required, MaxLength(10)]
    public string Phone { get; init; } = string.Empty;

    public UserRole Role { get; init; } = UserRole.Member;
}

public sealed class UpdateMemberRequest
{
    [Required, MaxLength(45)]
    public string FirstName { get; init; } = string.Empty;

    [Required, MaxLength(45)]
    public string LastName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(10)]
    public string Phone { get; init; } = string.Empty;
}

public sealed class MemberStatusRequest
{
    public bool IsActive { get; init; }
}
