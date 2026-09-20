using Microsoft.EntityFrameworkCore;
using Natillera.Backend.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NatilleraDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
