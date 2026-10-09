using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Natillera.Backend.Application.Activities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/activities")]
[Authorize]
public sealed class ActivitiesController(ActivityService activityService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<ActivityListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<ActivityListItem>>> Get(CancellationToken cancellationToken) =>
        Ok(await activityService.GetListAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ActivityDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ActivityDetailResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var activity = await activityService.GetDetailAsync(id, cancellationToken);
        return activity is null ? NotFound() : Ok(activity);
    }

    /// <summary>Creates an activity and its backing expense transaction atomically.</summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(ActivityDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ActivityDetailResponse>> Create([FromBody] ActivityRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var activity = await activityService.CreateActivityAsync(request, userId, cancellationToken);
            return Created($"/api/activities/{activity.Id}", activity);
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(ActivityDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ActivityDetailResponse>> Update(Guid id, [FromBody] ActivityRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await activityService.UpdateActivityAsync(id, request, userId, cancellationToken));
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    /// <summary>Cancels an activity and its transaction. Records are never physically deleted.</summary>
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
            await activityService.CancelActivityAsync(id, userId, cancellationToken);
            return NoContent();
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpGet("{activityId:guid}/assignments/{assignmentId:guid}")]
    [ProducesResponseType(typeof(ActivityAssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ActivityAssignmentResponse>> GetAssignment(Guid activityId, Guid assignmentId, CancellationToken cancellationToken)
    {
        var assignment = await activityService.GetAssignmentAsync(activityId, assignmentId, cancellationToken);
        return assignment is null ? NotFound() : Ok(assignment);
    }

    [HttpPost("{activityId:guid}/assignments")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(ActivityAssignmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ActivityAssignmentResponse>> CreateAssignment(Guid activityId, [FromBody] ActivityAssignmentRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var assignment = await activityService.CreateAssignmentAsync(activityId, request, userId, cancellationToken);
            return Created($"/api/activities/{activityId}/assignments/{assignment.Id}", assignment);
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpPut("{activityId:guid}/assignments/{assignmentId:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(ActivityAssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ActivityAssignmentResponse>> UpdateAssignment(Guid activityId, Guid assignmentId, [FromBody] ActivityAssignmentUpdateRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await activityService.UpdateAssignmentAsync(activityId, assignmentId, request, userId, cancellationToken));
        }
        catch (DomainException exception)
        {
            return DomainError(exception);
        }
    }

    [HttpDelete("{activityId:guid}/assignments/{assignmentId:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelAssignment(Guid activityId, Guid assignmentId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            await activityService.CancelAssignmentAsync(activityId, assignmentId, userId, cancellationToken);
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
