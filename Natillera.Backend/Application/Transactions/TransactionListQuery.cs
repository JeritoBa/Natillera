using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Application.Transactions;

/// <summary>TX-03: validated filters of the transactions list.</summary>
public sealed record TransactionListFilter(int Page, int PageSize, TransactionType? Type, string? Month);

/// <summary>TX-03: raw query string of <c>GET /api/transactions</c>.</summary>
public sealed class TransactionListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageRequest.DefaultPageSize;
    public string? Type { get; init; }
    public string? Month { get; init; }

    /// <summary>Validates the values; throws <see cref="Domain.Exceptions.DomainException"/> (400) when any is invalid.</summary>
    public TransactionListFilter Parse()
    {
        PageRequest.Validate(Page, PageSize);
        var type = QueryParsing.ParseEnum<TransactionType>(Type, "Unknown transaction type.");
        var month = string.IsNullOrWhiteSpace(Month) ? null : Month.Trim();
        if (month is not null)
            ColombiaTime.MonthRangeUtc(month); // validates the format

        return new TransactionListFilter(Page, PageSize, type, month);
    }
}
