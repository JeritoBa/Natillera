using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Presentation.Filters;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/logs")]
[SavingPeriodScoped]
[Authorize(Roles = nameof(UserRole.Admin))]
public sealed class LogsController(LogService logService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<LogListItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<LogListItem>>> Get([FromQuery] LogListQuery query, CancellationToken cancellationToken)
    {
        LogListFilter filter;
        try { filter = query.Parse(); }
        catch (DomainException exception) { return BadRequest(new { message = exception.Message }); }

        return Ok(await logService.GetPageAsync(this.SavingPeriod(), filter, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LogDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LogDetailResponse>> GetDetail(Guid id, CancellationToken cancellationToken)
    {
        var detail = await logService.GetDetailAsync(id, this.SavingPeriod(), cancellationToken);
        return detail is null ? NotFound() : Ok(detail);
    }
}
