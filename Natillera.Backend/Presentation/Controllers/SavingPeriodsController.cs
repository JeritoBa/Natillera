using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Application.SavingPeriods;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/saving-periods")]
[Authorize]
public sealed class SavingPeriodsController(SavingPeriodService savingPeriodService) : ControllerBase
{
    /// <summary>Lists the saving periods, newest first (PER-03). Not period-scoped.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<SavingPeriodResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<SavingPeriodResponse>>> Get(CancellationToken cancellationToken) =>
        Ok(await savingPeriodService.GetAllAsync(cancellationToken));
}
