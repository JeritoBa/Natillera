using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Tests.Application;

// TX-03
public class TransactionListQueryTests
{
    [Fact]
    public void Parse_Defaults_Page1Size50NoFilters_TX03()
    {
        var filter = new TransactionListQuery().Parse();

        Assert.Equal(1, filter.Page);
        Assert.Equal(50, filter.PageSize);
        Assert.Null(filter.Type);
        Assert.Null(filter.Month);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(1, 100)]
    [InlineData(99, 50)]
    public void Parse_ValidPaging_IsAccepted_TX03(int page, int pageSize)
    {
        var filter = new TransactionListQuery { Page = page, PageSize = pageSize }.Parse();

        Assert.Equal(page, filter.Page);
        Assert.Equal(pageSize, filter.PageSize);
    }

    [Theory]
    [InlineData(0, 50, "Page must be at least 1.")]
    [InlineData(-3, 50, "Page must be at least 1.")]
    [InlineData(1, 0, "Page size must be between 1 and 100.")]
    [InlineData(1, 101, "Page size must be between 1 and 100.")]
    public void Parse_InvalidPaging_Throws_TX03(int page, int pageSize, string message)
    {
        var ex = Assert.Throws<DomainException>(() => new TransactionListQuery { Page = page, PageSize = pageSize }.Parse());

        Assert.Equal(message, ex.Message);
    }

    [Fact]
    public void Parse_TypeAndMonth_AreParsed_TX03()
    {
        var filter = new TransactionListQuery { Type = "loanpayment", Month = "2026-03" }.Parse();

        Assert.Equal(TransactionType.LoanPayment, filter.Type);
        Assert.Equal("2026-03", filter.Month);
    }

    [Theory]
    [InlineData("Nope")]
    [InlineData("2")]
    public void Parse_UnknownType_Throws_TX03(string type)
    {
        var ex = Assert.Throws<DomainException>(() => new TransactionListQuery { Type = type }.Parse());

        Assert.Equal("Unknown transaction type.", ex.Message);
    }

    [Theory]
    [InlineData("2026-13")]
    [InlineData("2026-3")]
    [InlineData("2026-03-01")]
    [InlineData("abc")]
    public void Parse_MalformedMonth_Throws_TX03(string month)
    {
        var ex = Assert.Throws<DomainException>(() => new TransactionListQuery { Month = month }.Parse());

        Assert.Equal("Month must use the format YYYY-MM.", ex.Message);
    }

    [Fact]
    public void Parse_BlankTypeAndMonth_MeanNoFilter_TX03()
    {
        var filter = new TransactionListQuery { Type = " ", Month = "" }.Parse();

        Assert.Null(filter.Type);
        Assert.Null(filter.Month);
    }
}
