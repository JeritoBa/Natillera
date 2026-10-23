using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Domain.Entities;

namespace Natillera.Backend.Infrastructure.Persistence;

public class NatilleraDbContext(DbContextOptions<NatilleraDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<MonthlyPayment> MonthlyPayments => Set<MonthlyPayment>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<LoanPayment> LoanPayments => Set<LoanPayment>();
    public DbSet<Performance> Performances => Set<Performance>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ActivityAssignment> ActivityAssignments => Set<ActivityAssignment>();
    public DbSet<ExtraCost> ExtraCosts => Set<ExtraCost>();
    public DbSet<Log> Logs => Set<Log>();
    public DbSet<SavingPeriod> SavingPeriods => Set<SavingPeriod>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NatilleraDbContext).Assembly);
    }
}
