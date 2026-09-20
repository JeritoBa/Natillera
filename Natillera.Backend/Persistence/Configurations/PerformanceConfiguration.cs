using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Persistence.Configurations;

public sealed class PerformanceConfiguration : IEntityTypeConfiguration<Performance>
{
    public void Configure(EntityTypeBuilder<Performance> builder)
    {
        builder.ToTable("performances");
        builder.HasKey(performance => performance.Id);
        builder.Property(performance => performance.Id).ValueGeneratedNever();
        builder.Property(performance => performance.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(performance => performance.Description).HasMaxLength(200).IsRequired();
        builder.Property(performance => performance.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(performance => performance.LoanId);
        builder.HasIndex(performance => performance.TransactionId).IsUnique();
        builder.HasOne(performance => performance.Loan).WithMany(loan => loan.Performances)
            .HasForeignKey(performance => performance.LoanId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(performance => performance.Transaction).WithOne()
            .HasForeignKey<Performance>(performance => performance.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
