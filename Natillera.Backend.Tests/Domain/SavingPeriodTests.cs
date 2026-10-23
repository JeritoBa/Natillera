using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Domain;

public class SavingPeriodTests
{
    private static Loan CreateLoan(DateTime startDate, SavingPeriod period) =>
        new(1000m, 5m, startDate, Guid.NewGuid(), Guid.NewGuid(), period);

    private static Activity CreateActivity(DateTime startDate, SavingPeriod period) =>
        new("Rifa", "Rifa anual", 10, 1000m, 1500m, startDate, Guid.NewGuid(), period);

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10000)]
    public void SavingPeriod_Constructor_InvalidYear_Throws(int year)
    {
        Assert.Throws<DomainException>(() => new SavingPeriod(year));
    }

    [Fact]
    public void Transaction_Constructor_EmptySavingPeriod_Throws_PER02()
    {
        var ex = Assert.Throws<DomainException>(() =>
            new Transaction(1m, TransactionDirection.Income, TransactionType.Loan, "x", Guid.Empty));

        Assert.Equal("Saving period id is required.", ex.Message);
    }

    [Fact]
    public void Log_Constructor_EmptySavingPeriod_Throws_PER02()
    {
        var ex = Assert.Throws<DomainException>(() =>
            new Log(Guid.NewGuid(), LogEntityType.Loan, Guid.NewGuid(), LogAction.Create, Guid.Empty));

        Assert.Equal("Saving period id is required.", ex.Message);
    }

    [Fact]
    public void MonthlyPayment_Constructor_EmptySavingPeriod_Throws_MP11()
    {
        Assert.Throws<DomainException>(() => new MonthlyPayment(10m, 6, Guid.NewGuid(), Guid.Empty));
    }

    [Fact]
    public void Loan_Constructor_SetsSavingPeriod_PER02()
    {
        var loan = CreateLoan(new DateTime(2026, 3, 1), TestPeriods.Y2026);

        Assert.Equal(TestPeriods.Y2026.Id, loan.SavingPeriodId);
    }

    [Theory]
    [InlineData(2025, 12, 31)]
    [InlineData(2027, 1, 1)]
    public void Loan_Constructor_StartDateOutsidePeriod_Throws_PER05(int year, int month, int day)
    {
        var ex = Assert.Throws<DomainException>(() => CreateLoan(new DateTime(year, month, day), TestPeriods.Y2026));

        Assert.Equal("Start date must be within the saving period year 2026.", ex.Message);
    }

    [Theory]
    [InlineData(2026, 1, 1)]
    [InlineData(2026, 12, 31)]
    public void Loan_Constructor_StartDateBoundaries_Accepted_PER05(int year, int month, int day)
    {
        var loan = CreateLoan(new DateTime(year, month, day), TestPeriods.Y2026);

        Assert.Equal(new DateTime(year, month, day), loan.StartDate);
    }

    [Fact]
    public void Loan_Update_OtherPeriod_Throws_PER05()
    {
        var loan = CreateLoan(new DateTime(2026, 3, 1), TestPeriods.Y2026);

        Assert.Throws<DomainException>(() =>
            loan.UpdateDetails(1000m, 5m, new DateTime(2025, 3, 1), Guid.NewGuid(), TestPeriods.Y2025));
        Assert.Equal(TestPeriods.Y2026.Id, loan.SavingPeriodId);
    }

    [Fact]
    public void Loan_Update_StartDateOutsidePeriod_Throws_PER05()
    {
        var loan = CreateLoan(new DateTime(2026, 3, 1), TestPeriods.Y2026);

        Assert.Throws<DomainException>(() =>
            loan.UpdateDetails(1000m, 5m, new DateTime(2025, 12, 31), Guid.NewGuid(), TestPeriods.Y2026));
    }

    [Fact]
    public void Activity_Constructor_SetsSavingPeriod_PER02()
    {
        var activity = CreateActivity(new DateTime(2026, 3, 1), TestPeriods.Y2026);

        Assert.Equal(TestPeriods.Y2026.Id, activity.SavingPeriodId);
    }

    [Theory]
    [InlineData(2025, 12, 31)]
    [InlineData(2027, 1, 1)]
    public void Activity_Constructor_StartDateOutsidePeriod_Throws_PER05(int year, int month, int day)
    {
        Assert.Throws<DomainException>(() => CreateActivity(new DateTime(year, month, day), TestPeriods.Y2026));
    }

    [Theory]
    [InlineData(2026, 1, 1)]
    [InlineData(2026, 12, 31)]
    public void Activity_Constructor_StartDateBoundaries_Accepted_PER05(int year, int month, int day)
    {
        var activity = CreateActivity(new DateTime(year, month, day), TestPeriods.Y2026);

        Assert.Equal(new DateTime(year, month, day), activity.StartDate);
    }

    [Fact]
    public void Activity_Update_OtherPeriod_Throws_PER05()
    {
        var activity = CreateActivity(new DateTime(2026, 3, 1), TestPeriods.Y2026);

        Assert.Throws<DomainException>(() =>
            activity.UpdateDetails("Rifa", "Rifa anual", 10, 1000m, 1500m, new DateTime(2025, 3, 1), TestPeriods.Y2025));
        Assert.Equal(TestPeriods.Y2026.Id, activity.SavingPeriodId);
    }

    [Fact]
    public void Activity_Update_StartDateOutsidePeriod_Throws_PER05()
    {
        var activity = CreateActivity(new DateTime(2026, 3, 1), TestPeriods.Y2026);

        Assert.Throws<DomainException>(() =>
            activity.UpdateDetails("Rifa", "Rifa anual", 10, 1000m, 1500m, new DateTime(2027, 1, 1), TestPeriods.Y2026));
    }
}
