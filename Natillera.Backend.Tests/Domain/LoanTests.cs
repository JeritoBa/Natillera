using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Domain;

public class LoanTests
{
    private static Loan Create(decimal amount = 1000m, decimal rate = 5m) =>
        new(amount, rate, new DateTime(2025, 1, 15, 13, 45, 0), Guid.NewGuid(), Guid.NewGuid(), TestPeriods.Y2025);

    [Fact]
    public void Constructor_Valid_IsActiveWithDateOnlyStart()
    {
        var loan = Create();

        Assert.Equal(LoanStatus.Active, loan.Status);
        Assert.Equal(new DateTime(2025, 1, 15), loan.StartDate);
        Assert.Equal(1000m, loan.OutstandingPrincipal());
        Assert.Null(loan.EndDate);
    }

    [Theory]
    [InlineData(0, 5)]
    [InlineData(-1, 5)]
    [InlineData(100, -0.1)]
    public void Constructor_InvalidValues_Throws(double amount, double rate)
    {
        Assert.Throws<DomainException>(() => Create((decimal)amount, (decimal)rate));
    }

    [Fact]
    public void Constructor_ZeroInterestRate_IsAccepted()
    {
        var loan = Create(rate: 0m);

        Assert.Equal(0m, loan.InterestRate);
    }

    [Fact]
    public void OutstandingPrincipal_IgnoresCancelledPayments()
    {
        var loan = Create(1000m);
        var p1 = loan.RegisterPayment(300m, PaymentMethod.Cash, Guid.NewGuid());
        var p2 = loan.RegisterPayment(200m, PaymentMethod.Cash, Guid.NewGuid());
        Assert.Equal(500m, loan.OutstandingPrincipal());

        p2.Cancel();

        Assert.Equal(300m, loan.PrincipalPaid());
        Assert.Equal(700m, loan.OutstandingPrincipal());
        Assert.NotNull(p1);
    }

    [Theory]
    [InlineData(1000, 400, 600)]
    [InlineData(1000, 1000, 0)]
    [InlineData(1000, 1200, 0)]
    public void CalculateOutstandingPrincipal_NeverBelowZero(double initial, double paid, double expected)
    {
        Assert.Equal((decimal)expected, Loan.CalculateOutstandingPrincipal((decimal)initial, (decimal)paid));
    }

    [Fact]
    public void CalculateMonthlyInterest_UsesOutstandingPrincipal()
    {
        var loan = Create(1000m, 5m);
        loan.RegisterPayment(500m, PaymentMethod.Cash, Guid.NewGuid());

        Assert.Equal(25m, loan.CalculateMonthlyInterest());
    }

    [Fact]
    public void EnsurePaymentAllowed_ExceedsOutstanding_Throws()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(900m, PaymentMethod.Cash, Guid.NewGuid());

        Assert.Throws<DomainException>(() => loan.EnsurePaymentAllowed(100.01m));
    }

    [Fact]
    public void EnsurePaymentAllowed_EqualToOutstanding_DoesNotThrow()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(900m, PaymentMethod.Cash, Guid.NewGuid());

        loan.EnsurePaymentAllowed(100m);
    }

    [Fact]
    public void EnsurePaymentAllowed_WithPreviousAmount_AllowsEditUpToOriginalPlusOutstanding()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(900m, PaymentMethod.Cash, Guid.NewGuid());

        loan.EnsurePaymentAllowed(1000m, previousAmount: 900m);
        Assert.Throws<DomainException>(() => loan.EnsurePaymentAllowed(1000.01m, previousAmount: 900m));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void EnsurePaymentAllowed_NonPositive_Throws(double amount)
    {
        var loan = Create();

        Assert.Throws<DomainException>(() => loan.EnsurePaymentAllowed((decimal)amount));
    }

    [Fact]
    public void EnsurePaymentAllowed_CancelledLoan_Throws()
    {
        var loan = Create();
        loan.Cancel();

        Assert.Throws<DomainException>(() => loan.EnsurePaymentAllowed(10m));
    }

    [Fact]
    public void RegisterPayment_Valid_AddsPaidPayment()
    {
        var loan = Create();
        var txId = Guid.NewGuid();

        var payment = loan.RegisterPayment(250m, PaymentMethod.Transfer, txId);

        Assert.Single(loan.Payments);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.Equal(250m, payment.Amount);
        Assert.Equal(PaymentMethod.Transfer, payment.PaymentMethod);
        Assert.Equal(txId, payment.TransactionId);
        Assert.Equal(loan.Id, payment.LoanId);
    }

    [Fact]
    public void RegisterPayment_ExceedsOutstanding_ThrowsAndDoesNotAdd()
    {
        var loan = Create(100m);

        Assert.Throws<DomainException>(() => loan.RegisterPayment(100.01m, PaymentMethod.Cash, Guid.NewGuid()));
        Assert.Empty(loan.Payments);
    }

    [Fact]
    public void UpdatePayment_WithinAllowed_UpdatesAmount()
    {
        var loan = Create(1000m);
        var payment = loan.RegisterPayment(400m, PaymentMethod.Cash, Guid.NewGuid());

        loan.UpdatePayment(payment, 1000m, PaymentMethod.Transfer);

        Assert.Equal(1000m, payment.Amount);
        Assert.Equal(PaymentMethod.Transfer, payment.PaymentMethod);
        Assert.Equal(0m, loan.OutstandingPrincipal());
    }

    [Fact]
    public void UpdatePayment_ExceedsPrincipal_Throws()
    {
        var loan = Create(1000m);
        var payment = loan.RegisterPayment(400m, PaymentMethod.Cash, Guid.NewGuid());

        Assert.Throws<DomainException>(() => loan.UpdatePayment(payment, 1000.01m, PaymentMethod.Cash));
        Assert.Equal(400m, payment.Amount);
    }

    [Fact]
    public void RegisterInterest_Valid_AddsPendingPerformance()
    {
        var loan = Create();

        var perf = loan.RegisterInterest(50m, "Interes mayo");

        Assert.Single(loan.Performances);
        Assert.Equal(PaymentStatus.Pending, perf.Status);
        Assert.Null(perf.TransactionId);
    }

    [Fact]
    public void RegisterInterest_CancelledLoan_Throws()
    {
        var loan = Create();
        loan.Cancel();

        Assert.Throws<DomainException>(() => loan.RegisterInterest(50m, "x"));
    }

    [Fact]
    public void RefreshStatus_PrincipalSettledNoPendingInterest_BecomesPaid()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(1000m, PaymentMethod.Cash, Guid.NewGuid());

        var before = DateTime.UtcNow.Date;
        loan.RefreshStatus();
        var after = DateTime.UtcNow.Date;

        Assert.Equal(LoanStatus.Paid, loan.Status);
        Assert.True(loan.EndDate == before || loan.EndDate == after);
    }

    [Fact]
    public void CalculateMonthlyInterest_Midpoint_UsesBankersRounding_CurrentBehavior()
    {
        // Documents CURRENT behavior (MidpointRounding.ToEven in Loan.cs):
        // 10.10 * 5% = 0.505 -> 0.50 (even), 10.30 * 5% = 0.515 -> 0.52 (even).
        Assert.Equal(0.50m, Create(10.10m, 5m).CalculateMonthlyInterest());
        Assert.Equal(0.52m, Create(10.30m, 5m).CalculateMonthlyInterest());
    }

    [Fact]
    public void RefreshStatus_PrincipalSettledButPendingInterest_StaysActive()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(1000m, PaymentMethod.Cash, Guid.NewGuid());
        loan.RegisterInterest(10m, "Interes");

        loan.RefreshStatus();

        Assert.Equal(LoanStatus.Active, loan.Status);
    }

    [Fact]
    public void RefreshStatus_PendingInterestPaid_BecomesPaid()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(1000m, PaymentMethod.Cash, Guid.NewGuid());
        var interest = loan.RegisterInterest(10m, "Interes");
        interest.MarkAsPaid(Guid.NewGuid());

        loan.RefreshStatus();

        Assert.Equal(LoanStatus.Paid, loan.Status);
    }

    [Fact]
    public void RefreshStatus_PaidLoanWithCancelledPayment_ReturnsToActiveAndClearsEndDate()
    {
        var loan = Create(1000m);
        var payment = loan.RegisterPayment(1000m, PaymentMethod.Cash, Guid.NewGuid());
        loan.RefreshStatus();
        Assert.Equal(LoanStatus.Paid, loan.Status);

        payment.Cancel();
        loan.RefreshStatus();

        Assert.Equal(LoanStatus.Active, loan.Status);
        Assert.Null(loan.EndDate);
    }

    [Fact]
    public void RefreshStatus_PartiallyPaid_StaysActive()
    {
        var loan = Create(1000m);
        loan.RegisterPayment(999m, PaymentMethod.Cash, Guid.NewGuid());

        loan.RefreshStatus();

        Assert.Equal(LoanStatus.Active, loan.Status);
    }

    [Fact]
    public void RefreshStatus_Cancelled_DoesNothing()
    {
        var loan = Create(1000m);
        loan.Cancel();

        loan.RefreshStatus();

        Assert.Equal(LoanStatus.Cancelled, loan.Status);
    }

    [Fact]
    public void Cancel_WithoutPayments_Cancels()
    {
        var loan = Create();

        loan.Cancel();

        Assert.Equal(LoanStatus.Cancelled, loan.Status);
    }

    [Fact]
    public void Cancel_WithActivePayment_Throws()
    {
        var loan = Create();
        loan.RegisterPayment(10m, PaymentMethod.Cash, Guid.NewGuid());

        Assert.Throws<DomainException>(loan.Cancel);
        Assert.Equal(LoanStatus.Active, loan.Status);
    }

    [Fact]
    public void Cancel_WithActiveInterest_Throws()
    {
        var loan = Create();
        loan.RegisterInterest(10m, "x");

        Assert.Throws<DomainException>(loan.Cancel);
    }

    [Fact]
    public void Cancel_WithOnlyCancelledPaymentsAndInterest_Succeeds()
    {
        var loan = Create();
        loan.RegisterPayment(10m, PaymentMethod.Cash, Guid.NewGuid()).Cancel();
        loan.RegisterInterest(10m, "x").Cancel();

        loan.Cancel();

        Assert.Equal(LoanStatus.Cancelled, loan.Status);
    }

    [Fact]
    public void Cancel_Twice_Throws()
    {
        var loan = Create();
        loan.Cancel();

        Assert.Throws<DomainException>(loan.Cancel);
    }

    [Fact]
    public void UpdateDetails_NoPayments_UpdatesValues()
    {
        var loan = Create();
        var borrower = Guid.NewGuid();

        loan.UpdateDetails(2000m, 3m, new DateTime(2025, 2, 2, 10, 0, 0), borrower, TestPeriods.Y2025);

        Assert.Equal(2000m, loan.InitialAmount);
        Assert.Equal(3m, loan.InterestRate);
        Assert.Equal(new DateTime(2025, 2, 2), loan.StartDate);
        Assert.Equal(borrower, loan.BorrowerId);
        Assert.NotNull(loan.UpdatedAt);
    }

    [Fact]
    public void UpdateDetails_WithPayments_Throws()
    {
        var loan = Create();
        loan.RegisterPayment(10m, PaymentMethod.Cash, Guid.NewGuid());

        Assert.Throws<DomainException>(() => loan.UpdateDetails(2000m, 3m, new DateTime(2025, 6, 1), Guid.NewGuid(), TestPeriods.Y2025));
    }

    [Fact]
    public void UpdateDetails_Cancelled_Throws()
    {
        var loan = Create();
        loan.Cancel();

        Assert.Throws<DomainException>(() => loan.UpdateDetails(2000m, 3m, new DateTime(2025, 6, 1), Guid.NewGuid(), TestPeriods.Y2025));
    }

    [Fact]
    public void UpdateDetails_InvalidAmount_Throws()
    {
        var loan = Create();

        Assert.Throws<DomainException>(() => loan.UpdateDetails(0m, 3m, new DateTime(2025, 6, 1), Guid.NewGuid(), TestPeriods.Y2025));
        Assert.Equal(1000m, loan.InitialAmount);
    }
}
