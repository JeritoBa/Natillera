using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Persistence.Repositories;

public sealed class TransactionRepository(NatilleraDbContext dbContext) : ITransactionRepository
{
    public Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default) =>
        dbContext.Transactions.AddAsync(transaction, cancellationToken).AsTask();

    public async Task<IReadOnlyCollection<TransactionListItem>> GetOrderedAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Transactions
            .OrderByDescending(transaction => transaction.OccurredAt)
            .Select(transaction => new TransactionListItem(
                transaction.Id,
                transaction.Amount,
                transaction.Direction,
                transaction.Type,
                transaction.OccurredAt,
                transaction.Description,
                dbContext.MonthlyPayments
                    .Where(payment => payment.TransactionId == transaction.Id)
                    .Select(payment => payment.User.FirstName + " " + payment.User.LastName)
                    .FirstOrDefault()))
            .ToListAsync(cancellationToken);
    }
}
