using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class LogRepository(NatilleraDbContext dbContext) : ILogRepository
{
    public Task AddAsync(Log log, CancellationToken cancellationToken = default) =>
        dbContext.Logs.AddAsync(log, cancellationToken).AsTask();

    public async Task<IReadOnlyCollection<LogListItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Logs
            .AsNoTracking()
            .OrderByDescending(log => log.OccurredAt)
            .Select(log => new LogListItem(
                log.Id,
                log.EntityType,
                log.EntityId,
                log.Action,
                log.OccurredAt,
                log.OldValue,
                log.NewValue,
                log.UserId,
                log.User.FirstName + " " + log.User.LastName))
            .ToListAsync(cancellationToken);
    }

    public async Task<LogDetailResponse?> GetDetailAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var log = await dbContext.Logs
            .AsNoTracking()
            .Include(item => item.User)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (log is null) return null;

        var summary = new LogEntitySummary(null, null, null, null, null, null);
        if (log.EntityType == LogEntityType.MonthlyPayment)
        {
            var payment = await dbContext.MonthlyPayments
                .AsNoTracking()
                .Where(item => item.Id == log.EntityId)
                .Select(item => new LogEntitySummary(
                    item.User.FirstName + " " + item.User.LastName,
                    item.Year,
                    item.Month,
                    item.Status.ToString(),
                    item.Amount,
                    item.TransactionId))
                .SingleOrDefaultAsync(cancellationToken);
            if (payment is not null) summary = payment;
        }

        return new LogDetailResponse(
            log.Id, log.EntityType, log.EntityId, log.Action, log.OccurredAt, log.OldValue, log.NewValue,
            log.UserId, log.User.FirstName + " " + log.User.LastName, log.User.Email, summary);
    }
}
