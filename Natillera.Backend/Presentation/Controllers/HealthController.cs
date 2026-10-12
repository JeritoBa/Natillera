using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("health")]
[AllowAnonymous]
public sealed class HealthController(IConfiguration configuration) : ControllerBase
{
    // OPS-02: anonymous, never touches the database.
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> Get()
    {
        var commit = configuration["RENDER_GIT_COMMIT"];
        return Ok(new HealthResponse("ok", string.IsNullOrWhiteSpace(commit) ? null : commit));
    }
}

public sealed record HealthResponse(string Status, string? Commit);
