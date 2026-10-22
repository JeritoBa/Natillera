using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Natillera.Backend.Application.SavingPeriods;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Presentation.Filters;

/// <summary>Marks a controller or action as saving-period scoped (PER-04): it requires a valid X-Saving-Id header.</summary>
public sealed class SavingPeriodScopedAttribute() : TypeFilterAttribute(typeof(SavingPeriodFilter));

/// <summary>
/// Reads X-Saving-Id, loads the period and stores it for the controller. A missing, malformed or unknown id is a 400
/// written here (never through the "not found" -> 404 mapping). Authorization filters run before it, so 401/403 come first.
/// </summary>
public sealed class SavingPeriodFilter(ISavingPeriodRepository repository) : IAsyncActionFilter
{
    public const string HeaderName = "X-Saving-Id";
    private const string ItemKey = "SavingPeriod";

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var values) || string.IsNullOrWhiteSpace(values.ToString()))
        {
            context.Result = BadRequest("The X-Saving-Id header is required.");
            return;
        }

        if (!Guid.TryParse(values.ToString(), out var id))
        {
            context.Result = BadRequest("The X-Saving-Id header is not a valid id.");
            return;
        }

        var period = await repository.GetByIdAsync(id, context.HttpContext.RequestAborted);
        if (period is null)
        {
            context.Result = BadRequest("Saving period not found.");
            return;
        }

        context.HttpContext.Items[ItemKey] = period;
        await next();
    }

    public static SavingPeriod GetPeriod(HttpContext httpContext) =>
        httpContext.Items[ItemKey] as SavingPeriod
        ?? throw new InvalidOperationException("The endpoint is not marked with [SavingPeriodScoped].");

    private static BadRequestObjectResult BadRequest(string message) => new(new { message });
}

public static class SavingPeriodControllerExtensions
{
    /// <summary>The saving period selected by the X-Saving-Id header of the current request.</summary>
    public static SavingPeriod SavingPeriod(this ControllerBase controller) => SavingPeriodFilter.GetPeriod(controller.HttpContext);
}
