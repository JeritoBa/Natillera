using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.ToTable("activities");
        builder.HasKey(activity => activity.Id);
        builder.Property(activity => activity.Id).ValueGeneratedNever();
        builder.Property(activity => activity.Name).HasMaxLength(100).IsRequired();
        builder.Property(activity => activity.Description).HasMaxLength(200).IsRequired();
        builder.Property(activity => activity.UnitCost).HasPrecision(18, 2).IsRequired();
        builder.Property(activity => activity.UnitSalePrice).HasPrecision(18, 2).IsRequired();
        builder.Property(activity => activity.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(activity => activity.TransactionId).IsUnique();
        builder.HasOne(activity => activity.Transaction).WithOne()
            .HasForeignKey<Activity>(activity => activity.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
