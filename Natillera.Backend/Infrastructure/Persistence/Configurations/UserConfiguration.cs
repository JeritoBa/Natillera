using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Id).ValueGeneratedNever();
        builder.Property(user => user.FirstName).HasMaxLength(45).IsRequired();
        builder.Property(user => user.LastName).HasMaxLength(45).IsRequired();
        builder.Property(user => user.Email).HasMaxLength(100).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(300).IsRequired();
        builder.Property(user => user.Phone).HasMaxLength(10).IsRequired();
        builder.Property(user => user.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(user => user.Email).IsUnique();
    }
}
