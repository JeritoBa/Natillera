using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/monthly-payments")]
[Authorize]
public sealed class MonthlyPaymentsController(MonthlyPaymentService monthlyPaymentService) : ControllerBase
{
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyCollection<MonthlyPaymentListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<MonthlyPaymentListItem>>> Get(CancellationToken cancellationToken) =>
        Ok(await monthlyPaymentService.GetPaidOrderedAsync(cancellationToken));

    /// <summary>Creates a monthly payment and its backing income transaction atomically.</summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(MonthlyPaymentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MonthlyPaymentResponse>> Create(
        [FromBody] CreateMonthlyPaymentRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var payment = await monthlyPaymentService.CreateAsync(request, userId, cancellationToken);
            return Created($"/api/monthly-payments/{payment.Id}", payment);
        }
        catch (DomainException exception) when (exception.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new { message = exception.Message });
        }
        catch (DomainException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(MonthlyPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MonthlyPaymentResponse>> Update(Guid id, [FromBody] UpdateMonthlyPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await monthlyPaymentService.UpdateAsync(id, request, userId, cancellationToken));
        }
        catch (DomainException exception) when (exception.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new { message = exception.Message });
        }
        catch (DomainException exception) when (exception.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(new { message = exception.Message });
        }
        catch (DomainException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private bool TryGetUserId(out Guid userId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(userIdValue, out userId);
    }
}
