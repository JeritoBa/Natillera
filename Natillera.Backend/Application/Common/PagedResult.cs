using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Common;

/// <summary>TX-03 / AUD-04: one page of a server-side paginated list. <c>Total</c> is the filtered count.</summary>
public sealed record PagedResult<T>(IReadOnlyCollection<T> Items, int Total, int Page, int PageSize);

/// <summary>TX-03 / AUD-04: shared paging parameters (page >= 1, page size 1-100, default 50).</summary>
public static class PageRequest
{
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 100;

    public static void Validate(int page, int pageSize)
    {
        if (page < 1)
            throw new DomainException("Page must be at least 1.");
        if (pageSize < 1 || pageSize > MaxPageSize)
            throw new DomainException($"Page size must be between 1 and {MaxPageSize}.");
    }

    public static int Skip(int page, int pageSize) => (page - 1) * pageSize;
}
