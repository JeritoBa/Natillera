using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Natillera.Backend.Application.Transactions;

namespace Natillera.Backend.Presentation.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public sealed class TransactionsController(TransactionService transactionService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<TransactionListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<TransactionListItem>>> Get(CancellationToken cancellationToken) =>
        Ok(await transactionService.GetOrderedAsync(cancellationToken));
}
