using Natillera.Backend.Application.Audit;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Application;

// AUD-04
public class LogListQueryTests
{
    [Fact]
    public void Parse_Defaults_Page1Size50NoFilters_AUD04()
    {
        var filter = new LogListQuery().Parse();

        Assert.Equal(1, filter.Page);
        Assert.Equal(50, filter.PageSize);
        Assert.Null(filter.Term);
        Assert.Null(filter.Amount);
        Assert.Null(filter.Entity);
        Assert.Null(filter.Action);
        Assert.Null(filter.From);
        Assert.Null(filter.To);
    }

    [Theory]
    [InlineData(0, 50, "Page must be at least 1.")]
    [InlineData(1, 0, "Page size must be between 1 and 100.")]
    [InlineData(1, 101, "Page size must be between 1 and 100.")]
    public void Parse_InvalidPaging_Throws_AUD04(int page, int pageSize, string message)
    {
        var ex = Assert.Throws<DomainException>(() => new LogListQuery { Page = page, PageSize = pageSize }.Parse());

        Assert.Equal(message, ex.Message);
    }

    [Fact]
    public void Parse_ValidFilters_AreParsed_AUD04()
    {
        var filter = new LogListQuery { Entity = "Loan", Action = "delete", From = "2026-01-05", To = "2026-01-31", PageSize = 100 }.Parse();

        Assert.Equal(LogEntityType.Loan, filter.Entity);
        Assert.Equal(LogAction.Delete, filter.Action);
        Assert.Equal(new DateOnly(2026, 1, 5), filter.From);
        Assert.Equal(new DateOnly(2026, 1, 31), filter.To);
    }

    [Fact]
    public void Parse_SameDayRange_IsAccepted_AUD04()
    {
        var filter = new LogListQuery { From = "2026-02-10", To = "2026-02-10" }.Parse();

        Assert.Equal(filter.From, filter.To);
    }

    [Fact]
    public void Parse_FromAfterTo_Throws_AUD04()
    {
        var ex = Assert.Throws<DomainException>(() => new LogListQuery { From = "2026-03-02", To = "2026-03-01" }.Parse());

        Assert.Equal("The 'from' date must be on or before the 'to' date.", ex.Message);
    }

    [Theory]
    [InlineData("2026-3-1")]
    [InlineData("2026-02-30")]
    [InlineData("01/02/2026")]
    public void Parse_MalformedDate_Throws_AUD04(string date)
    {
        Assert.Equal("Dates must use the format YYYY-MM-DD.", Assert.Throws<DomainException>(() => new LogListQuery { From = date }.Parse()).Message);
        Assert.Equal("Dates must use the format YYYY-MM-DD.", Assert.Throws<DomainException>(() => new LogListQuery { To = date }.Parse()).Message);
    }

    [Fact]
    public void Parse_UnknownEntityOrAction_Throws_AUD04()
    {
        Assert.Equal("Unknown entity type.", Assert.Throws<DomainException>(() => new LogListQuery { Entity = "Nope" }.Parse()).Message);
        Assert.Equal("Unknown entity type.", Assert.Throws<DomainException>(() => new LogListQuery { Entity = "3" }.Parse()).Message);
        Assert.Equal("Unknown action.", Assert.Throws<DomainException>(() => new LogListQuery { Action = "Remove" }.Parse()).Message);
    }

    [Fact]
    public void Parse_TextTerm_IsTrimmedAndLowerCased_AUD04()
    {
        var filter = new LogListQuery { Q = "  María PÉREZ " }.Parse();

        Assert.Equal("maría pérez", filter.Term);
        Assert.Null(filter.Amount);
    }

    [Theory]
    [InlineData("50000", 50000)]
    [InlineData(" 120 ", 120)]
    [InlineData("-300", -300)]
    public void Parse_NumericTerm_AlsoSearchesExactAmount_AUD04(string q, int amount)
    {
        var filter = new LogListQuery { Q = q }.Parse();

        Assert.Equal(amount, filter.Amount);
        Assert.Equal(q.Trim(), filter.Term);
    }

    [Theory]
    [InlineData("$50000")]
    [InlineData("50.000")]
    [InlineData("50 000")]
    [InlineData("ana2")]
    public void Parse_FormattedOrMixedTerm_IsOnlyATextSearch_AUD04(string q)
    {
        Assert.Null(new LogListQuery { Q = q }.Parse().Amount);
    }

    [Fact]
    public void Parse_BlankTerm_MeansNoSearch_AUD04()
    {
        Assert.Null(new LogListQuery { Q = "   " }.Parse().Term);
    }
}
