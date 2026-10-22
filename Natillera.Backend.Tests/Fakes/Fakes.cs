using Natillera.Backend.Application.Activities;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Application.Loans;
using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Application.SavingPeriods;
using Natillera.Backend.Application.Security;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Tests.Fakes;

/// <summary>Shared saving periods for tests; records default to <see cref="Y2026"/>.</summary>
public static class TestPeriods
{
    public static readonly SavingPeriod Y2025 = new(2025);
    public static readonly SavingPeriod Y2026 = new(2026);
}

public sealed class FakeSavingPeriodRepository : ISavingPeriodRepository
{
    public List<SavingPeriod> Periods { get; } = [TestPeriods.Y2026, TestPeriods.Y2025];

    public Task<SavingPeriod?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Periods.FirstOrDefault(p => p.Id == id));

    public Task<IReadOnlyCollection<SavingPeriod>> GetAllAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyCollection<SavingPeriod>>(Periods.OrderByDescending(p => p.Year).ToList());
}

public sealed class FakeUnitOfWork : IUnitOfWork
{
    public int Executions { get; private set; }

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
    {
        Executions++;
        await operation(cancellationToken);
    }
}

public sealed class FakeLogRepository : ILogRepository
{
    public List<Log> Logs { get; } = [];

    public Task AddAsync(Log log, CancellationToken cancellationToken = default)
    {
        Logs.Add(log);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<LogListItem>> GetAllAsync(Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();

    public Task<LogDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
}

public sealed class FakeTransactionRepository : ITransactionRepository
{
    public List<Transaction> Transactions { get; } = [];

    public Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        Transactions.Add(transaction);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();

    public Task<TransactionDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();

    public Task<decimal> GetAvailableMoneyAsync(Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Available(savingPeriodId));

    private readonly Dictionary<Guid, decimal> _seededCash = [];

    /// <summary>Cash that exists outside the recorded transactions, so tests can seed money without extra Transactions.</summary>
    public decimal SeededCash => _seededCash.GetValueOrDefault(TestPeriods.Y2026.Id);

    /// <summary>Seeded cash plus non-cancelled Income minus Expense of one period (DASH-01, PER-06). Defaults to 2026.</summary>
    public decimal Available(Guid? savingPeriodId = null)
    {
        var id = savingPeriodId ?? TestPeriods.Y2026.Id;
        return _seededCash.GetValueOrDefault(id) + Transactions
            .Where(t => t.SavingPeriodId == id && !t.IsCancelled)
            .Sum(t => t.Direction == TransactionDirection.Income ? t.Amount : -t.Amount);
    }

    /// <summary>Sets the seeded cash so that the available money of the period (2026 by default) equals <paramref name="target"/>.</summary>
    public void SetAvailableMoney(decimal target, Guid? savingPeriodId = null)
    {
        var id = savingPeriodId ?? TestPeriods.Y2026.Id;
        _seededCash[id] = _seededCash.GetValueOrDefault(id) + target - Available(id);
    }
}

public sealed class FakeUserRepository : IUserRepository
{
    public Dictionary<Guid, User> Users { get; } = [];
    public MemberPendingObligations Pending { get; set; } = new(0, 0, 0, 0);
    public int SaveCount { get; private set; }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        Task.FromResult(Users.Values.FirstOrDefault(u => u.Email == email));

    public Task<List<User>> GetMembersAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(Users.Values.ToList());

    public Task<User?> GetMemberByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Users.GetValueOrDefault(id));

    public Task<bool> EmailExistsAsync(string email, Guid? excludedUserId = null, CancellationToken cancellationToken = default) =>
        Task.FromResult(Users.Values.Any(u => u.Email == email && u.Id != excludedUserId));

    public Task<bool> IsActiveUserAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Users.TryGetValue(id, out var u) && u.IsActive);

    public Task<MemberPendingObligations> GetPendingObligationsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Pending);

    public Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        Users[user.Id] = user;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveCount++;
        return Task.CompletedTask;
    }

    public User AddUser(bool active = true, string email = "juan@test.com")
    {
        var user = new User("Juan", "Perez", email, "hashed:secret123", "3001234567");
        if (!active) user.Deactivate();
        Users[user.Id] = user;
        return user;
    }
}

public sealed class FakeMonthlyPaymentRepository : IMonthlyPaymentRepository
{
    public List<MonthlyPayment> Payments { get; } = [];

    public Task<bool> ExistsAsync(Guid userId, Guid savingPeriodId, int month, CancellationToken cancellationToken = default) =>
        Task.FromResult(Payments.Any(p => p.UserId == userId && p.SavingPeriodId == savingPeriodId && p.Month == month
            && p.Status != Natillera.Backend.Domain.Enums.PaymentStatus.Cancelled));

    public Task<MonthlyPayment?> GetByIdAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Payments.FirstOrDefault(p => p.Id == id && p.SavingPeriodId == savingPeriodId));

    public Task<bool> ExistsForAnotherPaymentAsync(Guid userId, Guid savingPeriodId, int month, Guid paymentId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Payments.Any(p => p.UserId == userId && p.SavingPeriodId == savingPeriodId && p.Month == month && p.Id != paymentId
            && p.Status != Natillera.Backend.Domain.Enums.PaymentStatus.Cancelled));

    public Task AddAsync(MonthlyPayment payment, CancellationToken cancellationToken = default)
    {
        Payments.Add(payment);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<MonthlyPaymentListItem>> GetOrderedAsync(bool includeNonPaid, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
}

public sealed class FakeLoanRepository : ILoanRepository
{
    public List<Loan> Loans { get; } = [];
    public List<LoanPayment> AddedPayments { get; } = [];
    public List<Performance> AddedPerformances { get; } = [];

    public Task<IReadOnlyCollection<LoanListData>> GetListAsync(Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();

    public Task<Loan?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Loans.FirstOrDefault(l => l.Id == id && l.SavingPeriodId == savingPeriodId));

    public Task<Loan?> GetForUpdateAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Loans.FirstOrDefault(l => l.Id == id && l.SavingPeriodId == savingPeriodId));

    public Task AddAsync(Loan loan, CancellationToken cancellationToken = default)
    {
        Loans.Add(loan);
        return Task.CompletedTask;
    }

    public Task AddPaymentAsync(LoanPayment payment, CancellationToken cancellationToken = default)
    {
        AddedPayments.Add(payment);
        return Task.CompletedTask;
    }

    public Task AddPerformanceAsync(Performance performance, CancellationToken cancellationToken = default)
    {
        AddedPerformances.Add(performance);
        return Task.CompletedTask;
    }
}

public sealed class FakeActivityRepository : IActivityRepository
{
    public List<Activity> Activities { get; } = [];
    public List<ActivityAssignment> AddedAssignments { get; } = [];

    public Task<IReadOnlyCollection<ActivityListData>> GetListAsync(Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();

    public Task<Activity?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Activities.FirstOrDefault(a => a.Id == id && a.SavingPeriodId == savingPeriodId));

    public Task<Activity?> GetForUpdateAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Activities.FirstOrDefault(a => a.Id == id && a.SavingPeriodId == savingPeriodId));

    public Task AddAsync(Activity activity, CancellationToken cancellationToken = default)
    {
        Activities.Add(activity);
        return Task.CompletedTask;
    }

    public Task AddAssignmentAsync(ActivityAssignment assignment, CancellationToken cancellationToken = default)
    {
        AddedAssignments.Add(assignment);
        return Task.CompletedTask;
    }
}

public sealed class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => "hashed:" + password;
    public bool Verify(string password, string passwordHash) => passwordHash == "hashed:" + password;
}

public sealed class FakeJwtTokenGenerator : IJwtTokenGenerator
{
    public static readonly DateTime Expiry = new(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public JwtToken Generate(Guid userId, string email, string role) => new($"token:{userId}:{email}:{role}", Expiry);
}
