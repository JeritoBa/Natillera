using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Domain.Entities;

/// <summary>A saving period (one year). Periods are added by migrations, never from the app (PER-01).</summary>
public class SavingPeriod
{
    private SavingPeriod()
    {
    }

    public SavingPeriod(int year)
    {
        if (year is < 1 or > 9999)
            throw new DomainException("Saving period year must be between 1 and 9999.");

        Id = Guid.NewGuid();
        Year = year;
    }

    public Guid Id { get; private set; }
    public int Year { get; private set; }
}
