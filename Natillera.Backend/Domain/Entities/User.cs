using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

public class User
{
    private readonly List<MonthlyPayment> _monthlyPayments = [];

    private User()
    {
    }

    public User(string firstName, string lastName, string email, string passwordHash, string phone,
        UserRole role = UserRole.Member)
    {
        Id = Guid.NewGuid();
        FirstName = Required(firstName, nameof(firstName), 45);
        LastName = Required(lastName, nameof(lastName), 45);
        Email = Required(email, nameof(email), 100).ToLowerInvariant();
        PasswordHash = Required(passwordHash, nameof(passwordHash), 300);
        Phone = Required(phone, nameof(phone), 10);
        Role = role;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public string Phone { get; private set; } = null!;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public IReadOnlyCollection<MonthlyPayment> MonthlyPayments => _monthlyPayments;

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateProfile(string firstName, string lastName, string email, string phone)
    {
        FirstName = Required(firstName, nameof(firstName), 45);
        LastName = Required(lastName, nameof(lastName), 45);
        Email = Required(email, nameof(email), 100).ToLowerInvariant();
        Phone = Required(phone, nameof(phone), 10);
        UpdatedAt = DateTime.UtcNow;
    }

    private static string Required(string value, string name, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength)
            throw new DomainException($"{name} is required and must not exceed {maxLength} characters.");

        return value.Trim();
    }
}
