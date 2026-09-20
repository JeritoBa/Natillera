using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Persistence.Configurations;

public sealed class MonthlyPaymentConfiguration : IEntityTypeConfiguration<MonthlyPayment>
{
    public void Configure(EntityTypeBuilder<MonthlyPayment> builder)
    {
        builder.ToTable("monthly_payments");
        builder.HasKey(payment => payment.Id);
        builder.Property(payment => payment.Id).ValueGeneratedNever();
        builder.Property(payment => payment.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(payment => payment.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(payment => new { payment.UserId, payment.Year, payment.Month }).IsUnique();
        builder.HasIndex(payment => payment.TransactionId).IsUnique();
        builder.HasOne(payment => payment.User).WithMany(user => user.MonthlyPayments)
            .HasForeignKey(payment => payment.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(payment => payment.Transaction).WithOne()
            .HasForeignKey<MonthlyPayment>(payment => payment.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
