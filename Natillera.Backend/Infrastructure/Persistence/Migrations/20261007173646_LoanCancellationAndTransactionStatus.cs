using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Natillera.Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LoanCancellationAndTransactionStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCancelled",
                table: "transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "TransactionId",
                table: "performances",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "loan_payments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Paid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCancelled",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "loan_payments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TransactionId",
                table: "performances",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
