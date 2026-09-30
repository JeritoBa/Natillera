using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/members")]
[Authorize]
public sealed class MembersController(UserService userService, MemberDetailService memberDetailService, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<UserResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<UserResponse>>> Get(CancellationToken cancellationToken) =>
        Ok(await userService.GetMembersAsync(cancellationToken));

    [HttpGet("{id:guid}/details")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(MemberDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MemberDetailResponse>> GetDetails(Guid id, CancellationToken cancellationToken)
    {
        var detail = await memberDetailService.GetDetailAsync(id, cancellationToken);
        return detail is null ? NotFound(new { message = "Member not found." }) : Ok(detail);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateMemberRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var member = await userService.CreateMemberAsync(request.FirstName, request.LastName, request.Email, request.Phone, configuration, cancellationToken);
            return Created($"/api/members/{member.Id}", member);
        }
        catch (DomainException exception) when (exception.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new { message = exception.Message });
        }
        catch (DomainException exception) { return BadRequest(new { message = exception.Message }); }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<UserResponse>> Update(Guid id, [FromBody] UpdateMemberRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await userService.UpdateMemberAsync(id, request, cancellationToken)); }
        catch (DomainException exception) when (exception.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase)) { return Conflict(new { message = exception.Message }); }
        catch (DomainException exception) { return BadRequest(new { message = exception.Message }); }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<UserResponse>> SetStatus(Guid id, [FromBody] MemberStatusRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await userService.SetMemberStatusAsync(id, request.IsActive, cancellationToken)); }
        catch (DomainException exception) { return BadRequest(new { message = exception.Message }); }
    }
}
