using System.Globalization;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Transactions;

/// <summary>FIN-13: rejects a movement whose cash outflow is greater than the available money.</summary>
public static class CashGuard
{
    public static void EnsureAvailable(decimal available, decimal outflow)
    {
        if (outflow <= 0 || outflow <= available)
            return;

        throw new DomainException(string.Create(
            CultureInfo.InvariantCulture,
            $"Insufficient available money. Available: {available:N0}; required: {outflow:N0}."));
    }
}
