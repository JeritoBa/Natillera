using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Infrastructure.Persistence.Repositories;

public sealed class LogRepository(NatilleraDbContext dbContext) : ILogRepository
{
    public Task AddAsync(Log log, CancellationToken cancellationToken = default) =>
        dbContext.Logs.AddAsync(log, cancellationToken).AsTask();

    public async Task<PagedResult<LogListItem>> GetPageAsync(Guid savingPeriodId, LogListFilter filter, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Logs
            .AsNoTracking()
            .Where(log => log.SavingPeriodId == savingPeriodId);

        if (filter.Entity is { } entity)
            query = query.Where(log => log.EntityType == entity);
        if (filter.Action is { } action)
            query = query.Where(log => log.Action == action);

        var (startUtc, endUtc) = ColombiaTime.DayRangeUtc(filter.From, filter.To);
        if (startUtc is { } start)
            query = query.Where(log => log.OccurredAt >= start);
        if (endUtc is { } end)
            query = query.Where(log => log.OccurredAt < end);

        // AUD-04: user full name or entity id (case-insensitive), or the exact old/new amount for a numeric term.
        if (filter.Term is { } term)
        {
            var amount = filter.Amount;
            query = query.Where(log =>
                (log.User.FirstName + " " + log.User.LastName).ToLower().Contains(term)
                || log.EntityId.ToString().Contains(term)
                || (amount != null && (log.OldValue == amount || log.NewValue == amount)));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(log => log.OccurredAt)
            .ThenByDescending(log => log.Id)
            .Skip(PageRequest.Skip(filter.Page, filter.PageSize))
            .Take(filter.PageSize)
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

        return new PagedResult<LogListItem>(items, total, filter.Page, filter.PageSize);
    }

    public async Task<LogDetailResponse?> GetDetailAsync(Guid id, Guid savingPeriodId, CancellationToken cancellationToken = default)
    {
        var log = await dbContext.Logs
            .AsNoTracking()
            .Include(item => item.User)
            .SingleOrDefaultAsync(item => item.Id == id && item.SavingPeriodId == savingPeriodId, cancellationToken);
        if (log is null) return null;

        var summary = new LogEntitySummary(null, null, null, null, null, null);
        if (log.EntityType == LogEntityType.MonthlyPayment)
        {
            var payment = await dbContext.MonthlyPayments
                .AsNoTracking()
                .Where(item => item.Id == log.EntityId)
                .Select(item => new LogEntitySummary(
                    item.User.FirstName + " " + item.User.LastName,
                    item.SavingPeriod.Year,
                    item.Month,
                    item.Status.ToString(),
                    item.Amount,
                    item.TransactionId))
                .SingleOrDefaultAsync(cancellationToken);
            if (payment is not null) summary = payment;
        }
        else if (log.EntityType == LogEntityType.ExtraCost) // AUD-02
        {
            var extraCost = await dbContext.ExtraCosts
                .AsNoTracking()
                .Where(item => item.Id == log.EntityId)
                .Select(item => new LogEntitySummary(
                    null,
                    null,
                    null,
                    item.Status.ToString(),
                    item.Amount,
                    item.TransactionId,
                    item.ActivityId,
                    item.Activity.Name))
                .SingleOrDefaultAsync(cancellationToken);
            if (extraCost is not null) summary = extraCost;
        }

        return new LogDetailResponse(
            log.Id, log.EntityType, log.EntityId, log.Action, log.OccurredAt, log.OldValue, log.NewValue,
            log.UserId, log.User.FirstName + " " + log.User.LastName, log.User.Email, summary);
    }
}
