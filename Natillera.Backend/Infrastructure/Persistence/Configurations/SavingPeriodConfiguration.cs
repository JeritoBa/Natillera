using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class SavingPeriodConfiguration : IEntityTypeConfiguration<SavingPeriod>
{
    public void Configure(EntityTypeBuilder<SavingPeriod> builder)
    {
        builder.ToTable("saving_periods");
        builder.HasKey(period => period.Id);
        builder.Property(period => period.Id).ValueGeneratedNever();
        builder.Property(period => period.Year).IsRequired();
        builder.HasIndex(period => period.Year).IsUnique();
    }
}
