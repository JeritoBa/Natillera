using Natillera.Backend.Application.Dashboard;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Application;

public class PendingObligationsCalculatorTests
{
    private static readonly DateTime T = new(2026, 1, 1);

    private static FeeObligationRow Fee(PaymentStatus status, decimal amount = 30000m, int year = 2026, int month = 1,
        DateTime? createdAt = null) =>
        new(Guid.NewGuid(), year, month, amount, status, createdAt ?? T);

    private static LoanObligationRow Loan(LoanStatus status, decimal initial = 300000m, decimal paid = 100000m,
        DateTime? start = null) =>
        new(Guid.NewGuid(), start ?? T, T, initial, paid, status);

    private static InterestObligationRow Interest(PaymentStatus status, decimal amount = 4000m, DateTime? createdAt = null) =>
        new(Guid.NewGuid(), Guid.NewGuid(), createdAt ?? T, amount, status);

    private static AssignmentObligationRow Sale(AssignmentStatus status, ActivityStatus activity = ActivityStatus.Pending,
        int qty = 8, decimal price = 10000m, DateTime? assignedAt = null, string name = "Rifa") =>
        new(Guid.NewGuid(), Guid.NewGuid(), name, qty, price, status, activity, assignedAt ?? T);

    private static PendingObligationsData Data(
        FeeObligationRow[]? fees = null, LoanObligationRow[]? loans = null,
        InterestObligationRow[]? interests = null, AssignmentObligationRow[]? sales = null) =>
        new(fees ?? [], loans ?? [], interests ?? [], sales ?? []);

    [Fact]
    public void Fees_OnlyPendingCount_MEM10()
    {
        var pending = Fee(PaymentStatus.Pending);
        var result = PendingObligationsCalculator.Calculate(
            Data(fees: [pending, Fee(PaymentStatus.Paid), Fee(PaymentStatus.Cancelled)]));

        Assert.Equal(1, result.MonthlyPayments.Count);
        Assert.Equal(30000m, result.MonthlyPayments.Amount);
        Assert.Equal(pending.Id, result.MonthlyPayments.Items.Single().Id);
    }

    [Fact]
    public void Loans_OnlyActive_AmountIsOutstandingPrincipal_MEM10()
    {
        var active = Loan(LoanStatus.Active);
        var result = PendingObligationsCalculator.Calculate(
            Data(loans: [active, Loan(LoanStatus.Paid), Loan(LoanStatus.Cancelled)]));

        Assert.Equal(1, result.Loans.Count);
        Assert.Equal(200000m, result.Loans.Amount);
        var item = result.Loans.Items.Single();
        Assert.Equal(active.Id, item.Id);
        Assert.Equal(300000m, item.InitialAmount);
        Assert.Equal(200000m, item.OutstandingPrincipal);
    }

    [Fact]
    public void Loans_ActiveWithNoOutstandingPrincipal_NotListed_MEM10()
    {
        var result = PendingObligationsCalculator.Calculate(Data(
            loans: [Loan(LoanStatus.Active, 300000m, 300000m), Loan(LoanStatus.Active, 300000m, 350000m)],
            interests: [Interest(PaymentStatus.Pending)]));

        Assert.Equal(0, result.Loans.Count);
        Assert.Equal(0m, result.Loans.Amount);
        Assert.Equal(1, result.Interests.Count);
        Assert.Equal(4000m, result.Total);
    }

    [Fact]
    public void Interests_OnlyPendingCount_MEM10()
    {
        var result = PendingObligationsCalculator.Calculate(Data(
            interests: [Interest(PaymentStatus.Pending), Interest(PaymentStatus.Paid), Interest(PaymentStatus.Cancelled)]));

        Assert.Equal(1, result.Interests.Count);
        Assert.Equal(4000m, result.Interests.Amount);
    }

    [Fact]
    public void Sales_PendingAmountIsQuantityTimesPrice_MEM10()
    {
        var result = PendingObligationsCalculator.Calculate(Data(sales:
        [
            Sale(AssignmentStatus.Pending),
            Sale(AssignmentStatus.Paid),
            Sale(AssignmentStatus.Cancelled)
        ]));

        Assert.Equal(1, result.ActivitySales.Count);
        Assert.Equal(80000m, result.ActivitySales.Amount);
        Assert.Equal(8, result.ActivitySales.Items.Single().Quantity);
    }

    [Fact]
    public void Sales_OfCancelledActivity_Excluded_MEM10()
    {
        var result = PendingObligationsCalculator.Calculate(
            Data(sales: [Sale(AssignmentStatus.Pending, ActivityStatus.Cancelled)]));

        Assert.Equal(0, result.ActivitySales.Count);
        Assert.Equal(0m, result.Total);
    }

    [Fact]
    public void Total_IsSumOfFourKinds_AC1()
    {
        var result = PendingObligationsCalculator.Calculate(Data(
            fees: [Fee(PaymentStatus.Pending)],
            loans: [Loan(LoanStatus.Active)],
            interests: [Interest(PaymentStatus.Pending)],
            sales: [Sale(AssignmentStatus.Pending)]));

        Assert.Equal(314000m, result.Total);
    }

    [Fact]
    public void NothingPending_TotalZeroAndEmptyGroups()
    {
        var empty = PendingObligationsCalculator.Calculate(Data());
        var onlySettled = PendingObligationsCalculator.Calculate(Data(
            fees: [Fee(PaymentStatus.Paid), Fee(PaymentStatus.Cancelled)],
            loans: [Loan(LoanStatus.Paid)],
            interests: [Interest(PaymentStatus.Paid)],
            sales: [Sale(AssignmentStatus.Paid)]));

        foreach (var result in new[] { empty, onlySettled })
        {
            Assert.Equal(0m, result.Total);
            Assert.Empty(result.MonthlyPayments.Items);
            Assert.Empty(result.Loans.Items);
            Assert.Empty(result.Interests.Items);
            Assert.Empty(result.ActivitySales.Items);
        }
    }

    [Fact]
    public void Items_AreOrdered()
    {
        var result = PendingObligationsCalculator.Calculate(Data(
            fees:
            [
                Fee(PaymentStatus.Pending, year: 2026, month: 3),
                Fee(PaymentStatus.Pending, year: 2025, month: 12),
                Fee(PaymentStatus.Pending, year: 2026, month: 1)
            ],
            loans:
            [
                Loan(LoanStatus.Active, start: new DateTime(2026, 5, 1)),
                Loan(LoanStatus.Active, start: new DateTime(2026, 2, 1))
            ],
            interests:
            [
                Interest(PaymentStatus.Pending, createdAt: new DateTime(2026, 4, 1)),
                Interest(PaymentStatus.Pending, createdAt: new DateTime(2026, 3, 1))
            ],
            sales:
            [
                Sale(AssignmentStatus.Pending, assignedAt: new DateTime(2026, 4, 1), name: "B"),
                Sale(AssignmentStatus.Pending, assignedAt: new DateTime(2026, 2, 1), name: "A")
            ]));

        Assert.Equal([(2025, 12), (2026, 1), (2026, 3)], result.MonthlyPayments.Items.Select(i => (i.Year, i.Month)));
        Assert.Equal([new DateTime(2026, 2, 1), new DateTime(2026, 5, 1)], result.Loans.Items.Select(i => i.StartDate));
        Assert.Equal([new DateTime(2026, 3, 1), new DateTime(2026, 4, 1)], result.Interests.Items.Select(i => i.CreatedAt));
        Assert.Equal(["A", "B"], result.ActivitySales.Items.Select(i => i.ActivityName));
    }

    [Fact]
    public void Amounts_AreExactDecimals()
    {
        var result = PendingObligationsCalculator.Calculate(Data(
            fees: [Fee(PaymentStatus.Pending, 0.10m, month: 1), Fee(PaymentStatus.Pending, 0.20m, month: 2)]));

        Assert.Equal(0.30m, result.MonthlyPayments.Amount);
        Assert.Equal(0.30m, result.Total);
    }
}

public class DashboardServiceTests
{
    private sealed class StubDashboardRepo(DashboardSummaryResponse summary) : IDashboardRepository
    {
        public Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, string role, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
            Task.FromResult(summary);
    }

    private sealed class StubPendingRepo(PendingObligationsData data, params MemberPendingObligationsData[] all) : IPendingObligationsRepository
    {
        public int Calls { get; private set; }
        public int AllCalls { get; private set; }

        public Task<PendingObligationsData> GetDataAsync(Guid memberId, Guid savingPeriodId, CancellationToken cancellationToken = default)
        {
            Calls++;
            return Task.FromResult(data);
        }

        public Task<IReadOnlyCollection<MemberPendingObligationsData>> GetForAllMembersAsync(Guid savingPeriodId, CancellationToken cancellationToken = default)
        {
            AllCalls++;
            return Task.FromResult<IReadOnlyCollection<MemberPendingObligationsData>>(all);
        }
    }

    private static MemberPendingObligationsData MemberWith(string name, PendingObligationsData data, bool active = true) =>
        new(Guid.NewGuid(), name, active, data);

    private static PendingObligationsData Fees(params decimal[] amounts) =>
        new(amounts.Select((a, i) => new FeeObligationRow(Guid.NewGuid(), 2026, i + 1, a, PaymentStatus.Pending, DateTime.UtcNow)).ToArray(), [], [], []);

    private static Task<DashboardSummaryResponse> AdminRun(params MemberPendingObligationsData[] members) =>
        new DashboardService(new StubDashboardRepo(Summary("Admin")), new StubPendingRepo(OneFee(), members))
            .GetSummaryAsync(Guid.NewGuid(), "Admin", TestPeriods.Y2026, default);

    private static DashboardSummaryResponse Summary(string role) =>
        new(role, 0m, null, null, null, 0m, 0m, 1, [], [], null, null, null, null, null);

    private static PendingObligationsData OneFee() =>
        new([new FeeObligationRow(Guid.NewGuid(), 2026, 1, 30000m, PaymentStatus.Pending, DateTime.UtcNow)], [], [], []);

    [Fact]
    public async Task MemberSummary_IncludesPendingObligations_DASH11()
    {
        var pending = new StubPendingRepo(OneFee());
        var service = new DashboardService(new StubDashboardRepo(Summary("Member")), pending);

        var result = await service.GetSummaryAsync(Guid.NewGuid(), "Member", TestPeriods.Y2026, default);

        Assert.Equal(30000m, result.PendingObligations!.Total);
        Assert.Equal(1, result.PendingPayments);
        Assert.Equal("Member", result.Role);
    }

    [Fact]
    public async Task AdminSummary_DoesNotLoadSingleMemberPending_DASH11()
    {
        var pending = new StubPendingRepo(OneFee());
        var service = new DashboardService(new StubDashboardRepo(Summary("Admin")), pending);

        var result = await service.GetSummaryAsync(Guid.NewGuid(), "Admin", TestPeriods.Y2026, default);

        Assert.Null(result.PendingObligations);
        Assert.Equal(0, pending.Calls);
        Assert.Equal(1, pending.AllCalls);
    }

    [Fact]
    public async Task AdminSummary_MembersPending_OnlyTotalAboveZero_DASH14()
    {
        var result = await AdminRun(
            MemberWith("Ana", Fees(30000m)),
            MemberWith("Beto", new PendingObligationsData([], [], [], [])),
            MemberWith("Carla", new PendingObligationsData(
                [new FeeObligationRow(Guid.NewGuid(), 2026, 1, 30000m, PaymentStatus.Paid, DateTime.UtcNow)], [], [], [])));

        Assert.Equal(["Ana"], result.MembersPendingObligations!.Select(m => m.MemberName));
    }

    [Fact]
    public async Task AdminSummary_MembersPending_OrderedByTotalDescThenName_DASH14()
    {
        var result = await AdminRun(
            MemberWith("Zoe", Fees(30000m)),
            MemberWith("Ana", Fees(30000m)),
            MemberWith("Max", Fees(30000m, 30000m)));

        Assert.Equal(["Max", "Ana", "Zoe"], result.MembersPendingObligations!.Select(m => m.MemberName));
    }

    [Fact]
    public async Task AdminSummary_MembersPending_TotalsEqualCalculator_DASH14_MEM10()
    {
        var data = new PendingObligationsData(
            [new FeeObligationRow(Guid.NewGuid(), 2026, 1, 30000m, PaymentStatus.Pending, DateTime.UtcNow)],
            [
                new LoanObligationRow(Guid.NewGuid(), DateTime.UtcNow, DateTime.UtcNow, 300000m, 100000m, LoanStatus.Active),
                new LoanObligationRow(Guid.NewGuid(), DateTime.UtcNow, DateTime.UtcNow, 100000m, 100000m, LoanStatus.Active)
            ],
            [new InterestObligationRow(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow, 4000m, PaymentStatus.Pending)],
            [new AssignmentObligationRow(Guid.NewGuid(), Guid.NewGuid(), "Rifa", 8, 10000m, AssignmentStatus.Pending, ActivityStatus.Pending, DateTime.UtcNow)]);
        var expected = PendingObligationsCalculator.Calculate(data);

        var item = (await AdminRun(MemberWith("Ana", data))).MembersPendingObligations!.Single();

        Assert.Equal(expected.Total, item.Total);
        Assert.Equal(new PendingKindTotal(1, 30000m), item.MonthlyPayments);
        Assert.Equal(new PendingKindTotal(1, 200000m), item.Loans); // the loan with no principal left is not listed
        Assert.Equal(new PendingKindTotal(1, 4000m), item.Interests);
        Assert.Equal(new PendingKindTotal(1, 80000m), item.ActivitySales);
        Assert.Equal(314000m, item.Total);
    }

    [Fact]
    public async Task AdminSummary_MembersPending_IncludesInactiveMembers_DASH14()
    {
        var item = (await AdminRun(MemberWith("Ana", Fees(30000m), active: false))).MembersPendingObligations!.Single();

        Assert.False(item.IsActive);
    }

    [Fact]
    public async Task AdminSummary_MembersPending_EmptyWhenNobodyOwes_DASH14()
    {
        var result = await AdminRun(MemberWith("Ana", new PendingObligationsData([], [], [], [])));

        Assert.NotNull(result.MembersPendingObligations);
        Assert.Empty(result.MembersPendingObligations!);
    }

    [Fact]
    public async Task MemberSummary_MembersPendingObligationsIsNull_DASH14()
    {
        var service = new DashboardService(new StubDashboardRepo(Summary("Member")), new StubPendingRepo(OneFee()));

        var result = await service.GetSummaryAsync(Guid.NewGuid(), "Member", TestPeriods.Y2026, default);

        Assert.Null(result.MembersPendingObligations);
        Assert.Null(result.PaidMonthlyPayments);
    }
}
