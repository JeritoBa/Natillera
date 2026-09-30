using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence.Configurations;

public sealed class ActivityAssignmentConfiguration : IEntityTypeConfiguration<ActivityAssignment>
{
    public void Configure(EntityTypeBuilder<ActivityAssignment> builder)
    {
        builder.ToTable("activity_assignments");
        builder.HasKey(assignment => assignment.Id);
        builder.Property(assignment => assignment.Id).ValueGeneratedNever();
        builder.Property(assignment => assignment.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.HasIndex(assignment => assignment.ActivityId);
        builder.HasIndex(assignment => assignment.UserId);
        builder.HasIndex(assignment => assignment.TransactionId).IsUnique();
        builder.HasOne(assignment => assignment.Activity).WithMany(activity => activity.Assignments)
            .HasForeignKey(assignment => assignment.ActivityId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(assignment => assignment.User).WithMany()
            .HasForeignKey(assignment => assignment.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(assignment => assignment.Transaction).WithOne()
            .HasForeignKey<ActivityAssignment>(assignment => assignment.TransactionId).OnDelete(DeleteBehavior.Restrict);
    }
}
