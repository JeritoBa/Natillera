using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class LoanPaymentConfiguration : IEntityTypeConfiguration<LoanPayment>
{
    public void Configure(EntityTypeBuilder<LoanPayment> builder)
    {
        builder.ToTable("loan_payments");
        builder.HasKey(payment => payment.Id);
        builder.Property(payment => payment.Id).ValueGeneratedNever();
        builder.Property(payment => payment.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(payment => payment.PaymentMethod).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(payment => payment.LoanId);
        builder.HasIndex(payment => payment.TransactionId).IsUnique();
        builder.HasOne(payment => payment.Loan).WithMany(loan => loan.Payments)
            .HasForeignKey(payment => payment.LoanId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(payment => payment.Transaction).WithOne()
            .HasForeignKey<LoanPayment>(payment => payment.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
