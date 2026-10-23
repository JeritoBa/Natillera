using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Application.Loans;

public interface ILoanRepository
{
    Task<IReadOnlyCollection<LoanListData>> GetListAsync(Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<Loan?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task<Loan?> GetForUpdateAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default);
    Task AddAsync(Loan loan, CancellationToken cancellationToken = default);
    Task AddPaymentAsync(LoanPayment payment, CancellationToken cancellationToken = default);
    Task AddPerformanceAsync(Performance performance, CancellationToken cancellationToken = default);
}
