using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Application;

// TX-03 / AUD-04 / UI-06
public class ColombiaTimeTests
{
    private static DateTime Utc(int year, int month, int day, int hour = 0) => new(year, month, day, hour, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void MonthRangeUtc_March_StartsAt0500UtcAndEndsAtNextMonth()
    {
        var (start, end) = ColombiaTime.MonthRangeUtc("2026-03");

        Assert.Equal(Utc(2026, 3, 1, 5), start);
        Assert.Equal(Utc(2026, 4, 1, 5), end);
        Assert.Equal(DateTimeKind.Utc, start.Kind);
    }

    [Fact]
    public void MonthRangeUtc_December_EndsInJanuaryOfNextYear()
    {
        var (start, end) = ColombiaTime.MonthRangeUtc("2026-12");

        Assert.Equal(Utc(2026, 12, 1, 5), start);
        Assert.Equal(Utc(2027, 1, 1, 5), end);
    }

    [Theory]
    [InlineData("2026-13")]
    [InlineData("2026-00")]
    [InlineData("26-03")]
    [InlineData("2026-3")]
    [InlineData("")]
    public void MonthRangeUtc_Malformed_Throws(string month)
    {
        Assert.Throws<DomainException>(() => ColombiaTime.MonthRangeUtc(month));
    }

    [Fact]
    public void DayRangeUtc_OneDay_CoversExactly24Hours()
    {
        var (start, end) = ColombiaTime.DayRangeUtc(new DateOnly(2026, 2, 10), new DateOnly(2026, 2, 10));

        Assert.Equal(Utc(2026, 2, 10, 5), start);
        Assert.Equal(Utc(2026, 2, 11, 5), end);
    }

    [Fact]
    public void DayRangeUtc_MissingBounds_StayOpen()
    {
        Assert.Equal((null, null), ColombiaTime.DayRangeUtc(null, null));
        Assert.Equal((Utc(2026, 2, 10, 5), (DateTime?)null), ColombiaTime.DayRangeUtc(new DateOnly(2026, 2, 10), null));
    }

    [Fact]
    public void MonthKey_0300UtcOnDay1_BelongsToThePreviousColombiaMonth()
    {
        Assert.Equal("2026-02", ColombiaTime.MonthKey(Utc(2026, 3, 1, 3)));
        Assert.Equal("2026-03", ColombiaTime.MonthKey(Utc(2026, 3, 1, 5)));
        Assert.Equal("2025-12", ColombiaTime.MonthKey(Utc(2026, 1, 1, 4)));
    }

    [Fact]
    public void MonthKey_AgreesWithMonthRangeUtc()
    {
        var (start, end) = ColombiaTime.MonthRangeUtc("2026-03");

        Assert.Equal("2026-03", ColombiaTime.MonthKey(start));
        Assert.Equal("2026-03", ColombiaTime.MonthKey(end.AddTicks(-1)));
        Assert.Equal("2026-04", ColombiaTime.MonthKey(end));
    }
}
