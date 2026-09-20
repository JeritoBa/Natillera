using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Persistence.Configurations;

public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");
        builder.HasKey(transaction => transaction.Id);
        builder.Property(transaction => transaction.Id).ValueGeneratedNever();
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(transaction => transaction.Direction).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(transaction => transaction.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(transaction => transaction.Description).HasMaxLength(200).IsRequired();
        builder.HasIndex(transaction => transaction.OccurredAt);
    }
}
