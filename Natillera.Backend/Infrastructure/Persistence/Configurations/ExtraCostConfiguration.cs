using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class ExtraCostConfiguration : IEntityTypeConfiguration<ExtraCost>
{
    public void Configure(EntityTypeBuilder<ExtraCost> builder)
    {
        builder.ToTable("extra_costs");
        builder.HasKey(cost => cost.Id);
        builder.Property(cost => cost.Id).ValueGeneratedNever();
        builder.Property(cost => cost.Description).HasMaxLength(200).IsRequired();
        builder.Property(cost => cost.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(cost => cost.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(cost => cost.ActivityId);
        builder.HasIndex(cost => cost.TransactionId).IsUnique();
        builder.HasOne(cost => cost.Activity).WithMany(activity => activity.ExtraCosts)
            .HasForeignKey(cost => cost.ActivityId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(cost => cost.Transaction).WithOne()
            .HasForeignKey<ExtraCost>(cost => cost.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
