using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Domain;

public class UserTests
{
    private static User Create() => new("  Ana ", "Lopez", "ANA@Test.COM", "hash", "3001234567");

    [Fact]
    public void Constructor_Valid_NormalizesAndDefaultsToActiveMember()
    {
        var u = Create();

        Assert.Equal("Ana", u.FirstName);
        Assert.Equal("ana@test.com", u.Email);
        Assert.Equal(UserRole.Member, u.Role);
        Assert.True(u.IsActive);
    }

    [Theory]
    [InlineData("", "b", "e@x.com", "h", "1")]
    [InlineData("a", " ", "e@x.com", "h", "1")]
    [InlineData("a", "b", "", "h", "1")]
    [InlineData("a", "b", "e@x.com", "", "1")]
    [InlineData("a", "b", "e@x.com", "h", "")]
    [InlineData("a", "b", "e@x.com", "h", "12345678901")]
    public void Constructor_InvalidField_Throws(string first, string last, string email, string hash, string phone)
    {
        Assert.Throws<DomainException>(() => new User(first, last, email, hash, phone));
    }

    [Fact]
    public void Deactivate_ThenActivate_TogglesIsActiveAndSetsUpdatedAt()
    {
        var u = Create();

        u.Deactivate();
        Assert.False(u.IsActive);
        Assert.NotNull(u.UpdatedAt);

        u.Activate();
        Assert.True(u.IsActive);
    }

    [Fact]
    public void UpdateProfile_Valid_ChangesFields()
    {
        var u = Create();

        u.UpdateProfile("Luis", "Gomez", "LUIS@x.com", "3111111111");

        Assert.Equal("Luis", u.FirstName);
        Assert.Equal("luis@x.com", u.Email);
        Assert.NotNull(u.UpdatedAt);
    }

    [Fact]
    public void UpdateProfile_Invalid_Throws()
    {
        var u = Create();

        Assert.Throws<DomainException>(() => u.UpdateProfile("", "Gomez", "a@b.com", "1"));
    }
}

public class LogTests
{
    [Fact]
    public void Constructor_Valid_SetsFields()
    {
        var user = Guid.NewGuid();
        var entity = Guid.NewGuid();
        var at = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var log = new Log(user, LogEntityType.Loan, entity, LogAction.Update, 1m, 2m, at);

        Assert.Equal(user, log.UserId);
        Assert.Equal(entity, log.EntityId);
        Assert.Equal(LogEntityType.Loan, log.EntityType);
        Assert.Equal(LogAction.Update, log.Action);
        Assert.Equal(1m, log.OldValue);
        Assert.Equal(2m, log.NewValue);
        Assert.Equal(at, log.OccurredAt);
    }

    [Fact]
    public void Constructor_EmptyUser_Throws()
    {
        Assert.Throws<DomainException>(() => new Log(Guid.Empty, LogEntityType.Loan, Guid.NewGuid(), LogAction.Create));
    }

    [Fact]
    public void Constructor_EmptyEntity_Throws()
    {
        Assert.Throws<DomainException>(() => new Log(Guid.NewGuid(), LogEntityType.Loan, Guid.Empty, LogAction.Create));
    }

    [Fact]
    public void Constructor_UndefinedEnums_Throw()
    {
        Assert.Throws<DomainException>(() =>
            new Log(Guid.NewGuid(), (LogEntityType)999, Guid.NewGuid(), LogAction.Create));
        Assert.Throws<DomainException>(() =>
            new Log(Guid.NewGuid(), LogEntityType.Loan, Guid.NewGuid(), (LogAction)999));
    }
}
