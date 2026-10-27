using System.Globalization;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Common;

/// <summary>Strict parsing of list query-string values (400 with an English message, OPS-05).</summary>
public static class QueryParsing
{
    /// <summary>Parses an enum by name only (numbers are rejected). Null or blank means "no filter".</summary>
    public static T? ParseEnum<T>(string? value, string errorMessage) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var name = Enum.GetNames<T>().FirstOrDefault(item => string.Equals(item, value.Trim(), StringComparison.OrdinalIgnoreCase));
        return name is null ? throw new DomainException(errorMessage) : Enum.Parse<T>(name);
    }

    /// <summary>Parses "YYYY-MM-DD". Null or blank means "no date".</summary>
    public static DateOnly? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return DateOnly.TryParseExact(value.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date
            : throw new DomainException("Dates must use the format YYYY-MM-DD.");
    }
}
