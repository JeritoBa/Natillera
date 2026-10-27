using System.Globalization;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Common;

/// <summary>
/// UI-06 / TX-03 / AUD-04: Colombia civil dates (America/Bogota, fixed UTC-5, no daylight saving) over UTC timestamps.
/// Must agree with the frontend <c>transactionMonthKey</c>.
/// </summary>
public static class ColombiaTime
{
    private static readonly TimeSpan Offset = TimeSpan.FromHours(-5);

    /// <summary>Parses "YYYY-MM" and returns the UTC range [start, end) of that Colombia month.</summary>
    public static (DateTime StartUtc, DateTime EndUtc) MonthRangeUtc(string month)
    {
        if (month.Length != 7
            || !DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first))
            throw new DomainException("Month must use the format YYYY-MM.");

        return (StartOfDayUtc(first), StartOfDayUtc(first.AddMonths(1)));
    }

    /// <summary>UTC range [from 00:00, to + 1 day 00:00) in Colombia time; a missing bound stays open.</summary>
    public static (DateTime? StartUtc, DateTime? EndUtc) DayRangeUtc(DateOnly? from, DateOnly? to) =>
        (from is { } start ? StartOfDayUtc(start) : null, to is { } end ? StartOfDayUtc(end.AddDays(1)) : null);

    /// <summary>"YYYY-MM" of the Colombia date of a UTC instant.</summary>
    public static string MonthKey(DateTime utc) =>
        DateTime.SpecifyKind(utc, DateTimeKind.Utc).Add(Offset).ToString("yyyy-MM", CultureInfo.InvariantCulture);

    private static DateTime StartOfDayUtc(DateOnly date) =>
        DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue) - Offset, DateTimeKind.Utc);
}
