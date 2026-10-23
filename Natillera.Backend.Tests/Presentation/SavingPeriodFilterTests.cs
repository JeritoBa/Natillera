using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Natillera.Backend.Presentation.Filters;
using Natillera.Backend.Tests.Fakes;

namespace Natillera.Backend.Tests.Presentation;

public class SavingPeriodFilterTests
{
    private readonly SavingPeriodFilter _filter = new(new FakeSavingPeriodRepository());

    private static ActionExecutingContext Context(string? header)
    {
        var http = new DefaultHttpContext();
        if (header is not null) http.Request.Headers[SavingPeriodFilter.HeaderName] = header;
        var action = new ActionContext(http, new RouteData(), new ActionDescriptor());
        return new ActionExecutingContext(action, [], new Dictionary<string, object?>(), new object());
    }

    private async Task<bool> RunAsync(ActionExecutingContext context)
    {
        var nextCalled = false;
        await _filter.OnActionExecutionAsync(context, () =>
        {
            nextCalled = true;
            return Task.FromResult(new ActionExecutedContext(context, [], new object()));
        });
        return nextCalled;
    }

    private static string Message(ActionExecutingContext context)
    {
        var result = Assert.IsType<BadRequestObjectResult>(context.Result);
        return (string)result.Value!.GetType().GetProperty("message")!.GetValue(result.Value)!;
    }

    [Fact]
    public async Task MissingHeader_Returns400_PER04()
    {
        var context = Context(null);

        Assert.False(await RunAsync(context));
        Assert.Equal("The X-Saving-Id header is required.", Message(context));
    }

    [Fact]
    public async Task MalformedHeader_Returns400_PER04()
    {
        var context = Context("not-a-guid");

        Assert.False(await RunAsync(context));
        Assert.Equal("The X-Saving-Id header is not a valid id.", Message(context));
    }

    [Fact]
    public async Task UnknownId_Returns400_PER04()
    {
        var context = Context(Guid.NewGuid().ToString());

        Assert.False(await RunAsync(context));
        Assert.Equal("Saving period not found.", Message(context));
    }

    [Fact]
    public async Task ValidId_StoresPeriod_PER04()
    {
        var context = Context(TestPeriods.Y2025.Id.ToString());

        Assert.True(await RunAsync(context));
        Assert.Null(context.Result);
        Assert.Equal(TestPeriods.Y2025.Id, SavingPeriodFilter.GetPeriod(context.HttpContext).Id);
    }
}
