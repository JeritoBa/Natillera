using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Natillera.Backend.Presentation;

/// <summary>
/// OPS-05: every error body is <c>{ "message": "..." }</c> written by the app. Framework-generated bodies (ProblemDetails,
/// model-state dictionaries, exception pages) are never sent, so internals such as type names or trace ids never leak.
/// </summary>
public static class ApiErrors
{
    public const string InvalidRequest = "The request is invalid.";
    public const string Unexpected = "An unexpected error occurred.";

    /// <summary>First validation message from a data-annotation rule; binding/JSON errors get the generic message.</summary>
    public static string FromModelState(ModelStateDictionary modelState)
    {
        // Keys starting with '$' and errors carrying an exception come from the JSON reader and can name internal types;
        // when the body could not be read, the other entries (e.g. "The request field is required.") are only side effects.
        var unreadableBody = modelState.Any(pair =>
            pair.Key.StartsWith('$') || pair.Value.Errors.Any(error => error.Exception is not null));
        if (unreadableBody) return InvalidRequest;

        return modelState.Values
            .SelectMany(entry => entry.Errors)
            .Select(error => error.ErrorMessage)
            .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message)) ?? InvalidRequest;
    }

    public static IActionResult InvalidModelState(ActionContext context) =>
        new BadRequestObjectResult(new { message = FromModelState(context.ModelState) });
}
