using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Domain.Enums;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/logs")]
[Authorize(Roles = nameof(UserRole.Admin))]
public sealed class LogsController(LogService logService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<LogListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<LogListItem>>> Get(CancellationToken cancellationToken) =>
        Ok(await logService.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LogDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LogDetailResponse>> GetDetail(Guid id, CancellationToken cancellationToken)
    {
        var detail = await logService.GetDetailAsync(id, cancellationToken);
        return detail is null ? NotFound() : Ok(detail);
    }
}
