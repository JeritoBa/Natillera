using System.Globalization;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Transactions;

/// <summary>
/// DASH-12 / FIN-14: the shared interest pool of a period is its paid interest minus its paid extra costs.
/// Guards work on the raw value (it can only go negative through legacy data); the displayed value never goes below 0.
/// </summary>
public static class InterestPool
{
    public static decimal Net(decimal raw) => Math.Max(0m, raw);

    /// <summary>DASH-06: equal share among the active members, 2 decimals, half away from zero; 0 without members.</summary>
    public static decimal Share(decimal pool, int activeMembersCount) =>
        activeMembersCount == 0 ? 0m : Math.Round(pool / activeMembersCount, 2, MidpointRounding.AwayFromZero);

    /// <summary>FIN-14: an extra cost cannot be paid for more than the pool.</summary>
    public static void EnsureCovers(decimal rawPool, decimal outflow)
    {
        if (outflow <= 0 || outflow <= rawPool)
            return;

        throw new DomainException(string.Create(
            CultureInfo.InvariantCulture,
            $"Insufficient shared interest pool. Available: {Net(rawPool):N0}; required: {outflow:N0}."));
    }

    /// <summary>FIN-14: a paid interest cannot be cancelled or lowered below the paid extra costs.</summary>
    public static void EnsureReductionAllowed(decimal rawPool, decimal reduction)
    {
        if (reduction <= 0 || reduction <= rawPool)
            return;

        throw new DomainException(string.Create(
            CultureInfo.InvariantCulture,
            $"This change would leave the shared interest pool below zero. Pool: {Net(rawPool):N0}; reduction: {reduction:N0}."));
    }
}
