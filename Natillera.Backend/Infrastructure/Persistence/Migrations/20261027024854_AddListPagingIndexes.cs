using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Natillera.Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListPagingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_transactions_SavingPeriodId_OccurredAt",
                table: "transactions",
                columns: new[] { "SavingPeriodId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_logs_SavingPeriodId_OccurredAt",
                table: "logs",
                columns: new[] { "SavingPeriodId", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_transactions_SavingPeriodId_OccurredAt",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "IX_logs_SavingPeriodId_OccurredAt",
                table: "logs");
        }
    }
}
