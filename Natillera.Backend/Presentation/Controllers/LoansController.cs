using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Presentation.Filters;
using System.Security.Claims;
using Natillera.Backend.Application.Loans;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
[SavingPeriodScoped]
[Authorize]
public sealed class LoansController(LoanService loanService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<LoanListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<LoanListItem>>> Get(CancellationToken cancellationToken) =>
        Ok(await loanService.GetListAsync(this.SavingPeriod(), cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LoanDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanDetailResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var loan = await loanService.GetDetailAsync(id, this.SavingPeriod(), cancellationToken);
        return loan is null ? NotFound() : Ok(loan);
    }

    /// <summary>Creates a loan and its backing expense transaction atomically.</summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(LoanDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanDetailResponse>> Create([FromBody] LoanRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var loan = await loanService.CreateLoanAsync(request, userId, this.SavingPeriod(), cancellationToken);
            return Created($"/api/loans/{loan.Id}", loan);
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(LoanDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanDetailResponse>> Update(Guid id, [FromBody] LoanRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await loanService.UpdateLoanAsync(id, request, userId, this.SavingPeriod(), cancellationToken));
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    /// <summary>Cancels a loan and its transaction. Records are never physically deleted.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            await loanService.CancelLoanAsync(id, userId, this.SavingPeriod(), cancellationToken);
            return NoContent();
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpGet("{loanId:guid}/payments/{paymentId:guid}")]
    [ProducesResponseType(typeof(LoanPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanPaymentResponse>> GetPayment(Guid loanId, Guid paymentId, CancellationToken cancellationToken)
    {
        var payment = await loanService.GetPaymentAsync(loanId, paymentId, this.SavingPeriod(), cancellationToken);
        return payment is null ? NotFound() : Ok(payment);
    }

    [HttpPost("{loanId:guid}/payments")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(LoanPaymentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanPaymentResponse>> CreatePayment(Guid loanId, [FromBody] LoanPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var payment = await loanService.CreatePaymentAsync(loanId, request, userId, this.SavingPeriod(), cancellationToken);
            return Created($"/api/loans/{loanId}/payments/{payment.Id}", payment);
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpPut("{loanId:guid}/payments/{paymentId:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(LoanPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanPaymentResponse>> UpdatePayment(Guid loanId, Guid paymentId, [FromBody] LoanPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await loanService.UpdatePaymentAsync(loanId, paymentId, request, userId, this.SavingPeriod(), cancellationToken));
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpDelete("{loanId:guid}/payments/{paymentId:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelPayment(Guid loanId, Guid paymentId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            await loanService.CancelPaymentAsync(loanId, paymentId, userId, this.SavingPeriod(), cancellationToken);
            return NoContent();
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpGet("{loanId:guid}/interest-payments/{interestId:guid}")]
    [ProducesResponseType(typeof(InterestPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InterestPaymentResponse>> GetInterest(Guid loanId, Guid interestId, CancellationToken cancellationToken)
    {
        var interest = await loanService.GetInterestAsync(loanId, interestId, this.SavingPeriod(), cancellationToken);
        return interest is null ? NotFound() : Ok(interest);
    }

    [HttpPost("{loanId:guid}/interest-payments")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(InterestPaymentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InterestPaymentResponse>> CreateInterest(Guid loanId, [FromBody] InterestPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var interest = await loanService.CreateInterestAsync(loanId, request, userId, this.SavingPeriod(), cancellationToken);
            return Created($"/api/loans/{loanId}/interest-payments/{interest.Id}", interest);
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpPut("{loanId:guid}/interest-payments/{interestId:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(InterestPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InterestPaymentResponse>> UpdateInterest(Guid loanId, Guid interestId, [FromBody] InterestPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await loanService.UpdateInterestAsync(loanId, interestId, request, userId, this.SavingPeriod(), cancellationToken));
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpDelete("{loanId:guid}/interest-payments/{interestId:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelInterest(Guid loanId, Guid interestId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            await loanService.CancelInterestAsync(loanId, interestId, userId, this.SavingPeriod(), cancellationToken);
            return NoContent();
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    private ActionResult DomainError(DomainException exception) =>
        exception.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
            ? NotFound(new { message = exception.Message })
            : BadRequest(new { message = exception.Message });

    private bool TryGetUserId(out Guid userId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(userIdValue, out userId);
    }
}
