using System.Security.Claims;
using System.Text;
using System.Globalization;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Natillera.Backend.Application.Authentication;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Application.Dashboard;
using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Activities;
using Natillera.Backend.Application.Loans;
using Natillera.Backend.Application.MonthlyPayments;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Application.Security;
using Natillera.Backend.Application.SavingPeriods;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Infrastructure.Authentication;
using Natillera.Backend.Infrastructure.Security;
using Natillera.Backend.Infrastructure.Persistence;
using Natillera.Backend.Infrastructure.Persistence.Repositories;
using Natillera.Backend.Infrastructure.Persistence.Seed;
using Natillera.Backend.Presentation;

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
builder.Services.AddScoped<ILoanRepository, LoanRepository>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<ITransactionRepository,TransactionRepository>();
builder.Services.AddScoped<ILogRepository, LogRepository>();
builder.Services.AddScoped<ISavingPeriodRepository, SavingPeriodRepository>();
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IMemberDetailRepository, MemberDetailRepository>();
builder.Services.AddScoped<IPendingObligationsRepository, PendingObligationsRepository>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<MonthlyPaymentService>();
builder.Services.AddScoped<LoanService>();
builder.Services.AddScoped<ActivityService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<LogService>();
builder.Services.AddScoped<SavingPeriodService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<MemberDetailService>();

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

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var userIdValue = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? context.Principal?.FindFirstValue("sub");

                if (!Guid.TryParse(userIdValue, out var userId))
                {
                    context.Fail("Invalid user identifier.");
                    return;
                }

                var userRepository = context.HttpContext.RequestServices.GetRequiredService<IUserRepository>();
                if (!await userRepository.IsActiveUserAsync(userId, context.HttpContext.RequestAborted))
                    context.Fail("The user is inactive or does not exist.");
            }
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .ConfigureApiBehaviorOptions(options =>
    {
        // OPS-05: no framework error bodies; validation errors and bare status results use the app's format.
        options.InvalidModelStateResponseFactory = ApiErrors.InvalidModelState;
        options.SuppressMapClientErrors = true;
    });
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

if (DatabaseStartupPolicy.ShouldApplyMigrations(
        app.Environment.EnvironmentName,
        app.Configuration[DatabaseStartupPolicy.ApplyMigrationsKey]))
{
    app.Logger.LogInformation("Applying database migrations and admin seed.");
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<NatilleraDbContext>();
    await dbContext.Database.MigrateAsync();
    await AdminSeeder.SeedAsync(
        dbContext,
        scope.ServiceProvider.GetRequiredService<IPasswordHasher>(),
        app.Configuration);
}
else
{
    app.Logger.LogInformation("Skipping database migrations and admin seed (NATILLERA_APPLY_MIGRATIONS is not true).");
}

// OPS-05: an unhandled exception returns a generic message (never a stack trace or exception page); it is still logged.
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new { message = ApiErrors.Unexpected });
}));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
}

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
