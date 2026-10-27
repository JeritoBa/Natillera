using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Presentation.Filters;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/transactions")]
[SavingPeriodScoped]
[Authorize]
public sealed class TransactionsController(TransactionService transactionService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(TransactionPageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TransactionPageResponse>> Get([FromQuery] TransactionListQuery query, CancellationToken cancellationToken)
    {
        TransactionListFilter filter;
        try { filter = query.Parse(); }
        catch (DomainException exception) { return BadRequest(new { message = exception.Message }); }

        return Ok(await transactionService.GetPageAsync(this.SavingPeriod(), filter, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TransactionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransactionDetailResponse>> GetDetail(Guid id, CancellationToken cancellationToken)
    {
        var detail = await transactionService.GetDetailAsync(id, this.SavingPeriod(), cancellationToken);
        return detail is null ? NotFound() : Ok(detail);
    }
}
