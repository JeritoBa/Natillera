using System.Text;
using System.Globalization;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Application.Security;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Infrastructure.Authentication;
using Natillera.Backend.Infrastructure.Security;
using Natillera.Backend.Persistence;
using Natillera.Backend.Persistence.Repositories;
using Natillera.Backend.Persistence.Seed;

if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("JWT_SECRET")))
    DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var jwtOptions = new JwtOptions
{
    Secret = RequiredConfiguration(builder.Configuration, "JWT_SECRET"),
    Issuer = RequiredConfiguration(builder.Configuration, "JWT_ISSUER"),
    Audience = RequiredConfiguration(builder.Configuration, "JWT_AUDIENCE"),
    ExpirationMinutes = ParseExpiration(builder.Configuration)
};

if (Encoding.UTF8.GetByteCount(jwtOptions.Secret) < 32)
    throw new InvalidOperationException("JWT_SECRET must contain at least 32 bytes.");

builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(jwtOptions));
builder.Services.AddDbContext<NatilleraDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddSingleton(new MonthlyPaymentOptions(ParseMinimumMonthlyPayment(builder.Configuration)));

var corsOrigins = (builder.Configuration["CORS_ORIGINS"] ?? "http://localhost:5173,http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMonthlyPaymentRepository, MonthlyPaymentRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddScoped<MonthlyPaymentService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<UserService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Natillera API",
        Version = "v1",
        Description = "Backend API for Natillera authentication and financial management."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a JWT token using the Bearer scheme."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });

    var xmlFile = $"{typeof(Program).Assembly.GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<NatilleraDbContext>();
    await dbContext.Database.MigrateAsync();
    await AdminSeeder.SeedAsync(
        dbContext,
        scope.ServiceProvider.GetRequiredService<IPasswordHasher>(),
        app.Configuration);

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static string RequiredConfiguration(IConfiguration configuration, string key) =>
    configuration[key] ?? throw new InvalidOperationException($"Missing required configuration: {key}");

static int ParseExpiration(IConfiguration configuration)
{
    var value = RequiredConfiguration(configuration, "JWT_EXPIRATION_MINUTES");
    if (!int.TryParse(value, out var minutes) || minutes <= 0)
        throw new InvalidOperationException("JWT_EXPIRATION_MINUTES must be a positive integer.");

    return minutes;
}

static decimal ParseMinimumMonthlyPayment(IConfiguration configuration)
{
    var value = RequiredConfiguration(configuration, "NATILLERA_MIN_MONTHLY_PAYMENT");
    if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount) || amount <= 0)
        throw new InvalidOperationException("NATILLERA_MIN_MONTHLY_PAYMENT must be a positive decimal.");

    return amount;
}
