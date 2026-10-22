using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Loans;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class LoanRepository(NatilleraDbContext dbContext) : ILoanRepository
{
    public async Task<IReadOnlyCollection<LoanListData>> GetListAsync(Guid savingPeriodId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Loans.AsNoTracking()
            .Where(loan => loan.SavingPeriodId == savingPeriodId)
            .OrderByDescending(loan => loan.StartDate)
            .ThenByDescending(loan => loan.CreatedAt)
            .Select(loan => new LoanListData(
                loan.Id,
                loan.BorrowerId,
                loan.Borrower.FirstName + " " + loan.Borrower.LastName,
                loan.InitialAmount,
                loan.InterestRate,
                loan.StartDate,
                loan.Status,
                dbContext.LoanPayments
                    .Where(payment => payment.LoanId == loan.Id && payment.Status != PaymentStatus.Cancelled)
                    .Select(payment => (decimal?)payment.Amount).Sum() ?? 0m))
            .ToArrayAsync(cancellationToken);
    }

    public Task<Loan?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        dbContext.Loans.AsNoTracking()
            .Include(loan => loan.Borrower)
            .Include(loan => loan.Payments)
            .Include(loan => loan.Performances)
            .SingleOrDefaultAsync(loan => loan.Id == id && loan.SavingPeriodId == savingPeriodId, cancellationToken);

    public Task<Loan?> GetForUpdateAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default) =>
        dbContext.Loans
            .Include(loan => loan.Transaction)
            .Include(loan => loan.Borrower)
            .Include(loan => loan.Payments).ThenInclude(payment => payment.Transaction)
            .Include(loan => loan.Performances).ThenInclude(performance => performance.Transaction)
            .SingleOrDefaultAsync(loan => loan.Id == id && loan.SavingPeriodId == savingPeriodId, cancellationToken);

    public Task AddAsync(Loan loan, CancellationToken cancellationToken = default) =>
        dbContext.Loans.AddAsync(loan, cancellationToken).AsTask();

    public Task AddPaymentAsync(LoanPayment payment, CancellationToken cancellationToken = default) =>
        dbContext.LoanPayments.AddAsync(payment, cancellationToken).AsTask();

    public Task AddPerformanceAsync(Performance performance, CancellationToken cancellationToken = default) =>
        dbContext.Performances.AddAsync(performance, cancellationToken).AsTask();
}
