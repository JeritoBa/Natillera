using System.Text.RegularExpressions;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Audit;

/// <summary>AUD-04: validated filters of the audit log list. <c>Term</c> is trimmed and lower-case; <c>Amount</c> is set when the term is digits only.</summary>
public sealed record LogListFilter(
    int Page, int PageSize, string? Term, decimal? Amount, LogEntityType? Entity, LogAction? Action, DateOnly? From, DateOnly? To);

/// <summary>AUD-04: raw query string of <c>GET /api/logs</c>.</summary>
public sealed partial class LogListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageRequest.DefaultPageSize;
    public string? Q { get; init; }
    public string? Entity { get; init; }
    public string? Action { get; init; }
    public string? From { get; init; }
    public string? To { get; init; }

    /// <summary>Validates the values; throws <see cref="DomainException"/> (400) when any is invalid.</summary>
    public LogListFilter Parse()
    {
        PageRequest.Validate(Page, PageSize);
        var entity = QueryParsing.ParseEnum<LogEntityType>(Entity, "Unknown entity type.");
        var action = QueryParsing.ParseEnum<LogAction>(Action, "Unknown action.");
        var from = QueryParsing.ParseDate(From);
        var to = QueryParsing.ParseDate(To);
        if (from is { } start && to is { } end && start > end)
            throw new DomainException("The 'from' date must be on or before the 'to' date.");

        var term = string.IsNullOrWhiteSpace(Q) ? null : Q.Trim().ToLowerInvariant();
        decimal? amount = term is not null && DigitsOnly().IsMatch(term) ? decimal.Parse(term) : null;
        return new LogListFilter(Page, PageSize, term, amount, entity, action, from, to);
    }

    // Exact amount search: digits only (optional minus), so "1.500", "$ 1500" or free text stay a text search.
    [GeneratedRegex(@"^-?\d{1,16}$")]
    private static partial Regex DigitsOnly();
}
