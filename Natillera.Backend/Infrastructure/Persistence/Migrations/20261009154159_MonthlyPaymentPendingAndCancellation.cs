using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Natillera.Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MonthlyPaymentPendingAndCancellation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_monthly_payments_UserId_Year_Month",
                table: "monthly_payments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TransactionId",
                table: "monthly_payments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<DateTime>(
                name: "PaidAt",
                table: "monthly_payments",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.CreateIndex(
                name: "IX_monthly_payments_UserId_Year_Month",
                table: "monthly_payments",
                columns: new[] { "UserId", "Year", "Month" },
                unique: true,
                filter: "\"Status\" <> 'Cancelled'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_monthly_payments_UserId_Year_Month",
                table: "monthly_payments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TransactionId",
                table: "monthly_payments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "PaidAt",
                table: "monthly_payments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_monthly_payments_UserId_Year_Month",
                table: "monthly_payments",
                columns: new[] { "UserId", "Year", "Month" },
                unique: true);
        }
    }
}
