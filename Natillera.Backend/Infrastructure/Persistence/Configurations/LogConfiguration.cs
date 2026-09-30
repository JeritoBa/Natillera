using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class LogConfiguration : IEntityTypeConfiguration<Log>
{
    public void Configure(EntityTypeBuilder<Log> builder)
    {
        builder.ToTable("logs");
        builder.HasKey(log => log.Id);
        builder.Property(log => log.Id).ValueGeneratedNever();
        builder.Property(log => log.EntityType).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(log => log.EntityId).IsRequired();
        builder.Property(log => log.Action).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(log => log.OccurredAt).IsRequired();
        builder.Property(log => log.OldValue).HasPrecision(18, 2);
        builder.Property(log => log.NewValue).HasPrecision(18, 2);
        builder.HasIndex(log => new { log.EntityType, log.EntityId });
        builder.HasIndex(log => log.OccurredAt);
        builder.HasIndex(log => log.UserId);
        builder.HasOne(log => log.User).WithMany()
            .HasForeignKey(log => log.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
