using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Application;

public class UserServiceSetMemberStatusTests
{
    private readonly FakeUserRepository _users = new();
    private readonly UserService _service;

    public UserServiceSetMemberStatusTests()
    {
        _service = new UserService(_users, new FakePasswordHasher());
    }

    [Fact]
    public async Task SetMemberStatusAsync_DeactivateWithPending_ThrowsWithDetail()
    {
        var member = _users.AddUser();
        _users.Pending = new MemberPendingObligations(2, 1, 3, 4);

        var ex = await Assert.ThrowsAsync<DomainException>(() => _service.SetMemberStatusAsync(member.Id, false, default));

        Assert.Contains("2 monthly payment(s)", ex.Message);
        Assert.Contains("1 active loan(s)", ex.Message);
        Assert.Contains("3 interest payment(s)", ex.Message);
        Assert.Contains("4 activity assignment(s)", ex.Message);
        Assert.True(member.IsActive);
        Assert.Equal(0, _users.SaveCount);
    }

    [Fact]
    public async Task SetMemberStatusAsync_DeactivateWithSinglePendingKind_OnlyMentionsThatKind()
    {
        var member = _users.AddUser();
        _users.Pending = new MemberPendingObligations(1, 0, 0, 0);

        var ex = await Assert.ThrowsAsync<DomainException>(() => _service.SetMemberStatusAsync(member.Id, false, default));

        Assert.Contains("1 monthly payment(s)", ex.Message);
        Assert.DoesNotContain("loan", ex.Message);
    }

    [Fact]
    public async Task SetMemberStatusAsync_OnlyPendingActivityAssignments_BlocksDeactivation()
    {
        var member = _users.AddUser();
        _users.Pending = new MemberPendingObligations(0, 0, 0, 1);

        var ex = await Assert.ThrowsAsync<DomainException>(() => _service.SetMemberStatusAsync(member.Id, false, default));

        Assert.Contains("1 activity assignment(s)", ex.Message);
        Assert.True(member.IsActive);
    }

    [Theory]
    [InlineData(1, 0, 0, 0)]
    [InlineData(0, 1, 0, 0)]
    [InlineData(0, 0, 1, 0)]
    [InlineData(0, 0, 0, 1)]
    public void MemberPendingObligations_HasAny_TrueWhenEachCounterIsOne(int payments, int loans, int interests, int assignments)
    {
        Assert.True(new MemberPendingObligations(payments, loans, interests, assignments).HasAny);
    }

    [Fact]
    public void MemberPendingObligations_HasAny_FalseWhenAllZero()
    {
        Assert.False(new MemberPendingObligations(0, 0, 0, 0).HasAny);
    }

    [Fact]
    public async Task SetMemberStatusAsync_DeactivateWithoutPending_Deactivates()
    {
        var member = _users.AddUser();

        var response = await _service.SetMemberStatusAsync(member.Id, false, default);

        Assert.False(response.IsActive);
        Assert.False(member.IsActive);
        Assert.Equal(1, _users.SaveCount);
    }

    [Fact]
    public async Task SetMemberStatusAsync_ActivateEvenWithPending_Activates()
    {
        var member = _users.AddUser(active: false);
        _users.Pending = new MemberPendingObligations(5, 5, 5, 5);

        var response = await _service.SetMemberStatusAsync(member.Id, true, default);

        Assert.True(response.IsActive);
        Assert.True(member.IsActive);
    }

    [Fact]
    public async Task SetMemberStatusAsync_UnknownMember_Throws()
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() => _service.SetMemberStatusAsync(Guid.NewGuid(), true, default));

        Assert.Equal("Member not found.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ShortPassword_Throws()
    {
        var request = new CreateUserRequest { FirstName = "A", LastName = "B", Email = "a@b.com", Password = "short", Phone = "1" };

        await Assert.ThrowsAsync<DomainException>(() => _service.CreateAsync(request, default));
    }

    [Fact]
    public async Task CreateAsync_DuplicateEmail_Throws()
    {
        _users.AddUser(email: "dup@test.com");
        var request = new CreateUserRequest { FirstName = "A", LastName = "B", Email = " DUP@test.com ", Password = "password1", Phone = "1" };

        await Assert.ThrowsAsync<DomainException>(() => _service.CreateAsync(request, default));
    }

    [Fact]
    public async Task CreateAsync_Valid_HashesPasswordAndNormalizesEmail()
    {
        var request = new CreateUserRequest { FirstName = "A", LastName = "B", Email = " New@Test.com ", Password = "password1", Phone = "1", Role = UserRole.Admin };

        var response = await _service.CreateAsync(request, default);

        Assert.Equal("new@test.com", response.Email);
        Assert.Equal(UserRole.Admin, response.Role);
        Assert.Equal("hashed:password1", _users.Users[response.Id].PasswordHash);
    }
}

public class MemberDetailServiceTests
{
    private sealed class StubRepo(MemberDetailData? data) : IMemberDetailRepository
    {
        public Task<MemberDetailData?> GetDetailAsync(Guid memberId, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
            Task.FromResult(data);
    }

    private static MemberDetailData Data(decimal savings, decimal activity, decimal sharedPool, int members) =>
        new(new MemberInfoResponse(Guid.NewGuid(), "A", "B", "a@b.com", "1", UserRole.Member, true, DateTime.UtcNow, null),
            savings, activity, sharedPool, members, [], []);

    private sealed class StubPendingRepo(PendingObligationsData data) : IPendingObligationsRepository
    {
        public Task<PendingObligationsData> GetDataAsync(Guid memberId, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
            Task.FromResult(data);
    }

    private static Task<MemberDetailResponse?> Run(MemberDetailData? data, PendingObligationsData? pending = null) =>
        new MemberDetailService(new StubRepo(data), new StubPendingRepo(pending ?? new PendingObligationsData([], [], [], [])))
            .GetDetailAsync(Guid.NewGuid(), TestPeriods.Y2026, default);

    [Fact]
    public async Task GetDetailAsync_IncludesPendingObligations_MEM10()
    {
        var pending = new PendingObligationsData(
            [new FeeObligationRow(Guid.NewGuid(), 2026, 5, 30000m, PaymentStatus.Pending, DateTime.UtcNow)], [], [], []);

        var result = await Run(Data(0m, 0m, 0m, 1), pending);

        Assert.Equal(30000m, result!.PendingObligations.Total);
        Assert.Single(result.PendingObligations.MonthlyPayments.Items);
    }

    [Fact]
    public async Task GetDetailAsync_MemberNotFound_ReturnsNull()
    {
        Assert.Null(await Run(null));
    }

    [Fact]
    public async Task GetDetailAsync_NoActiveMembers_PerformanceEarningsZero()
    {
        var result = await Run(Data(100m, 50m, 300m, 0));

        Assert.Equal(0m, result!.Balance.PerformanceEarnings);
        Assert.Equal(150m, result.Balance.Total);
    }

    [Fact]
    public async Task GetDetailAsync_EvenSplit_DividesAmongActiveMembers()
    {
        var result = await Run(Data(100m, 0m, 300m, 3));

        Assert.Equal(100m, result!.Balance.PerformanceEarnings);
    }

    [Fact]
    public async Task GetDetailAsync_ShareUsesSharedPool_DASH12()
    {
        // The repository hands over the net pool (paid interest 700 - paid extra costs 100); 600 / 3 = 200 each.
        var result = await Run(Data(0m, 0m, 600m, 3));

        Assert.Equal(200m, result!.Balance.PerformanceEarnings);
    }

    [Fact]
    public async Task GetDetailAsync_Rounding_UsesTwoDecimalsAwayFromZero()
    {
        // 100 / 3 = 33.3333...
        var result = await Run(Data(0m, 0m, 100m, 3));
        Assert.Equal(33.33m, result!.Balance.PerformanceEarnings);

        // 0.05 / 2 = 0.025 -> 0.03 (away from zero), banker's rounding would give 0.02
        var midpoint = await Run(Data(0m, 0m, 0.05m, 2));
        Assert.Equal(0.03m, midpoint!.Balance.PerformanceEarnings);
    }

    [Fact]
    public async Task GetDetailAsync_Total_IsSumOfSavingsActivityAndPerformances()
    {
        var result = await Run(Data(1000m, 250.50m, 90m, 4));

        Assert.Equal(22.50m, result!.Balance.PerformanceEarnings);
        Assert.Equal(1000m + 250.50m + 22.50m, result.Balance.Total);
        Assert.Equal(1000m, result.Balance.Savings);
        Assert.Equal(250.50m, result.Balance.ActivityEarnings);
    }
}

public class AuthenticationServiceTests
{
    private readonly FakeUserRepository _users = new();
    private readonly AuthenticationService _service;

    public AuthenticationServiceTests()
    {
        _service = new AuthenticationService(_users, new FakePasswordHasher(), new FakeJwtTokenGenerator());
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokenAndUser()
    {
        var user = _users.AddUser(email: "juan@test.com");

        var response = await _service.LoginAsync(new LoginRequest("  JUAN@test.com ", "secret123"), default);

        Assert.Equal($"token:{user.Id}:juan@test.com:Member", response.AccessToken);
        Assert.Equal(FakeJwtTokenGenerator.Expiry, response.ExpiresAt);
        Assert.Equal(user.Id, response.User.Id);
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsGenericMessage()
    {
        _users.AddUser();

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.LoginAsync(new LoginRequest("juan@test.com", "wrong"), default));

        Assert.Equal("Invalid email or password.", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_UnknownEmail_ThrowsSameGenericMessage()
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.LoginAsync(new LoginRequest("nobody@test.com", "secret123"), default));

        Assert.Equal("Invalid email or password.", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_InactiveUserWithValidPassword_ThrowsInactive()
    {
        _users.AddUser(active: false);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.LoginAsync(new LoginRequest("juan@test.com", "secret123"), default));

        Assert.Equal("The user is inactive.", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_InactiveUserWithWrongPassword_DoesNotRevealInactive()
    {
        _users.AddUser(active: false);

        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.LoginAsync(new LoginRequest("juan@test.com", "wrong"), default));

        Assert.Equal("Invalid email or password.", ex.Message);
    }

    [Theory]
    [InlineData("", "x")]
    [InlineData("a@b.com", "")]
    [InlineData("  ", "  ")]
    public async Task LoginAsync_MissingFields_Throws(string email, string password)
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            _service.LoginAsync(new LoginRequest(email, password), default));

        Assert.Equal("Email and password are required.", ex.Message);
    }
}
