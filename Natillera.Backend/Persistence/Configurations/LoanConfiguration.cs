using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Persistence.Configurations;

public sealed class LoanConfiguration : IEntityTypeConfiguration<Loan>
{
    public void Configure(EntityTypeBuilder<Loan> builder)
    {
        builder.ToTable("loans");
        builder.HasKey(loan => loan.Id);
        builder.Property(loan => loan.Id).ValueGeneratedNever();
        builder.Property(loan => loan.InitialAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(loan => loan.InterestRate).HasPrecision(9, 4).IsRequired();
        builder.Property(loan => loan.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(loan => loan.TransactionId).IsUnique();
        builder.HasOne(loan => loan.Borrower).WithMany()
            .HasForeignKey(loan => loan.BorrowerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(loan => loan.Transaction).WithOne()
            .HasForeignKey<Loan>(loan => loan.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
