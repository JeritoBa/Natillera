namespace Natillera.Backend.Application.SavingPeriods;

public sealed record SavingPeriodResponse(Guid Id, int Year);

public sealed class SavingPeriodService(ISavingPeriodRepository repository)
{
    public async Task<IReadOnlyCollection<SavingPeriodResponse>> GetAllAsync(CancellationToken cancellationToken) =>
        (await repository.GetAllAsync(cancellationToken))
        .Select(period => new SavingPeriodResponse(period.Id, period.Year))
        .ToArray();
}
