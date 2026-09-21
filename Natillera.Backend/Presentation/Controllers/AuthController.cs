using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthenticationService authenticationService) : ControllerBase
{
    /// <summary>Authenticates a user and returns a JWT bearer token.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await authenticationService.LoginAsync(request, cancellationToken));
        }
        catch (DomainException exception)
        {
            return Unauthorized(new { message = exception.Message });
        }
    }
}
