using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Natillera.Backend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLoanDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "loans",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "loans");
        }
    }
}
