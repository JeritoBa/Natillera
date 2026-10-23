using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Natillera.Backend.Presentation;

namespace Natillera.Backend.Tests.Presentation;

public class ApiErrorsTests
{
    [Fact]
    public void FromModelState_ValidationRule_ReturnsItsMessage_OPS05()
    {
        var state = new ModelStateDictionary();
        state.AddModelError("Amount", "The field Amount must be between 0.01 and 79228162514264337593543950335.");

        Assert.Equal("The field Amount must be between 0.01 and 79228162514264337593543950335.", ApiErrors.FromModelState(state));
    }

    [Fact]
    public void FromModelState_JsonReaderError_ReturnsGenericMessage_OPS05()
    {
        var state = new ModelStateDictionary();
        state.AddModelError("$.startDate", "The JSON value could not be converted to Natillera.Backend.Application.Loans.LoanRequest.");

        Assert.Equal(ApiErrors.InvalidRequest, ApiErrors.FromModelState(state));
    }

    [Fact]
    public void FromModelState_JsonReaderErrorWithRequiredSideEffect_ReturnsGenericMessage_OPS05()
    {
        var state = new ModelStateDictionary();
        state.AddModelError("request", "The request field is required.");
        state.AddModelError("$.initialAmount", "The JSON value could not be converted to System.Decimal.");

        Assert.Equal(ApiErrors.InvalidRequest, ApiErrors.FromModelState(state));
    }

    [Fact]
    public void FromModelState_ErrorWithException_ReturnsGenericMessage_OPS05()
    {
        var state = new ModelStateDictionary();
        state.AddModelError("request", new InvalidOperationException("Internal detail"), new EmptyModelMetadataProvider().GetMetadataForType(typeof(string)));

        Assert.Equal(ApiErrors.InvalidRequest, ApiErrors.FromModelState(state));
    }

    [Fact]
    public void FromModelState_Empty_ReturnsGenericMessage_OPS05()
    {
        Assert.Equal(ApiErrors.InvalidRequest, ApiErrors.FromModelState(new ModelStateDictionary()));
    }

    [Fact]
    public void InvalidModelState_ReturnsBadRequestWithMessageBody_OPS05()
    {
        var context = new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor());
        context.ModelState.AddModelError("$", "Unexpected token.");

        var result = Assert.IsType<BadRequestObjectResult>(ApiErrors.InvalidModelState(context));
        var message = result.Value!.GetType().GetProperty("message")!.GetValue(result.Value);
        Assert.Equal(ApiErrors.InvalidRequest, message);
    }
}
