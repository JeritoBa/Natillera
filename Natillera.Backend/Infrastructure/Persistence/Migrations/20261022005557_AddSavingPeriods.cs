using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Natillera.Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSavingPeriods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saving_periods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saving_periods", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_saving_periods_Year",
                table: "saving_periods",
                column: "Year",
                unique: true);

            // PER-08: period 2026 has a fixed id; every distinct fee year other than 2026 gets its own period.
            migrationBuilder.Sql(@"INSERT INTO saving_periods (""Id"", ""Year"") VALUES ('00000000-0000-4000-8000-000000002026', 2026);");
            migrationBuilder.Sql(@"INSERT INTO saving_periods (""Id"", ""Year"")
                SELECT gen_random_uuid(), y.""Year"" FROM (SELECT DISTINCT ""Year"" FROM monthly_payments WHERE ""Year"" <> 2026) y;");

            migrationBuilder.AddColumn<Guid>(
                name: "SavingPeriodId",
                table: "transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SavingPeriodId",
                table: "monthly_payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SavingPeriodId",
                table: "logs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SavingPeriodId",
                table: "loans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SavingPeriodId",
                table: "activities",
                type: "uuid",
                nullable: true);

            // Fees take the period of their current Year; a fee's transaction and logs take the fee's period.
            migrationBuilder.Sql(@"UPDATE monthly_payments mp SET ""SavingPeriodId"" = sp.""Id"" FROM saving_periods sp WHERE sp.""Year"" = mp.""Year"";");
            migrationBuilder.Sql(@"UPDATE transactions t SET ""SavingPeriodId"" = mp.""SavingPeriodId"" FROM monthly_payments mp WHERE mp.""TransactionId"" = t.""Id"";");
            migrationBuilder.Sql(@"UPDATE logs l SET ""SavingPeriodId"" = mp.""SavingPeriodId"" FROM monthly_payments mp WHERE l.""EntityType"" = 'MonthlyPayment' AND l.""EntityId"" = mp.""Id"";");

            // Everything else (loans, activities, their transactions and logs, child logs) belongs to 2026.
            migrationBuilder.Sql(@"UPDATE transactions SET ""SavingPeriodId"" = '00000000-0000-4000-8000-000000002026' WHERE ""SavingPeriodId"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE logs SET ""SavingPeriodId"" = '00000000-0000-4000-8000-000000002026' WHERE ""SavingPeriodId"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE loans SET ""SavingPeriodId"" = '00000000-0000-4000-8000-000000002026' WHERE ""SavingPeriodId"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE activities SET ""SavingPeriodId"" = '00000000-0000-4000-8000-000000002026' WHERE ""SavingPeriodId"" IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "SavingPeriodId",
                table: "transactions",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "SavingPeriodId",
                table: "monthly_payments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "SavingPeriodId",
                table: "logs",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "SavingPeriodId",
                table: "loans",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "SavingPeriodId",
                table: "activities",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.DropIndex(
                name: "IX_monthly_payments_UserId_Year_Month",
                table: "monthly_payments");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "monthly_payments");

            migrationBuilder.CreateIndex(
                name: "IX_monthly_payments_UserId_SavingPeriodId_Month",
                table: "monthly_payments",
                columns: new[] { "UserId", "SavingPeriodId", "Month" },
                unique: true,
                filter: "\"Status\" <> 'Cancelled'");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_SavingPeriodId",
                table: "transactions",
                column: "SavingPeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_monthly_payments_SavingPeriodId",
                table: "monthly_payments",
                column: "SavingPeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_logs_SavingPeriodId",
                table: "logs",
                column: "SavingPeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_loans_SavingPeriodId",
                table: "loans",
                column: "SavingPeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_activities_SavingPeriodId",
                table: "activities",
                column: "SavingPeriodId");

            migrationBuilder.AddForeignKey(
                name: "FK_transactions_saving_periods_SavingPeriodId",
                table: "transactions",
                column: "SavingPeriodId",
                principalTable: "saving_periods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_monthly_payments_saving_periods_SavingPeriodId",
                table: "monthly_payments",
                column: "SavingPeriodId",
                principalTable: "saving_periods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logs_saving_periods_SavingPeriodId",
                table: "logs",
                column: "SavingPeriodId",
                principalTable: "saving_periods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_loans_saving_periods_SavingPeriodId",
                table: "loans",
                column: "SavingPeriodId",
                principalTable: "saving_periods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_activities_saving_periods_SavingPeriodId",
                table: "activities",
                column: "SavingPeriodId",
                principalTable: "saving_periods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "monthly_payments",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"UPDATE monthly_payments mp SET ""Year"" = sp.""Year"" FROM saving_periods sp WHERE sp.""Id"" = mp.""SavingPeriodId"";");

            migrationBuilder.AlterColumn<int>(
                name: "Year",
                table: "monthly_payments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.DropIndex(
                name: "IX_monthly_payments_UserId_SavingPeriodId_Month",
                table: "monthly_payments");

            migrationBuilder.CreateIndex(
                name: "IX_monthly_payments_UserId_Year_Month",
                table: "monthly_payments",
                columns: new[] { "UserId", "Year", "Month" },
                unique: true,
                filter: "\"Status\" <> 'Cancelled'");

            migrationBuilder.DropForeignKey(
                name: "FK_transactions_saving_periods_SavingPeriodId",
                table: "transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_monthly_payments_saving_periods_SavingPeriodId",
                table: "monthly_payments");

            migrationBuilder.DropForeignKey(
                name: "FK_logs_saving_periods_SavingPeriodId",
                table: "logs");

            migrationBuilder.DropForeignKey(
                name: "FK_loans_saving_periods_SavingPeriodId",
                table: "loans");

            migrationBuilder.DropForeignKey(
                name: "FK_activities_saving_periods_SavingPeriodId",
                table: "activities");

            migrationBuilder.DropIndex(
                name: "IX_transactions_SavingPeriodId",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "SavingPeriodId",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "IX_monthly_payments_SavingPeriodId",
                table: "monthly_payments");

            migrationBuilder.DropColumn(
                name: "SavingPeriodId",
                table: "monthly_payments");

            migrationBuilder.DropIndex(
                name: "IX_logs_SavingPeriodId",
                table: "logs");

            migrationBuilder.DropColumn(
                name: "SavingPeriodId",
                table: "logs");

            migrationBuilder.DropIndex(
                name: "IX_loans_SavingPeriodId",
                table: "loans");

            migrationBuilder.DropColumn(
                name: "SavingPeriodId",
                table: "loans");

            migrationBuilder.DropIndex(
                name: "IX_activities_SavingPeriodId",
                table: "activities");

            migrationBuilder.DropColumn(
                name: "SavingPeriodId",
                table: "activities");

            migrationBuilder.DropTable(
                name: "saving_periods");
        }
    }
}
