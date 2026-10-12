using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Natillera.Backend.Presentation.Controllers;

namespace Natillera.Backend.Tests.Presentation;

public class HealthControllerTests
{
    private static HealthController Create(string? commit)
    {
        var values = new Dictionary<string, string?>();
        if (commit is not null) values["RENDER_GIT_COMMIT"] = commit;
        return new HealthController(new ConfigurationBuilder().AddInMemoryCollection(values).Build());
    }

    [Fact]
    public void Get_ReturnsOkWithCommit_OPS02()
    {
        var result = Create("abc123").Get();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(new HealthResponse("ok", "abc123"), ok.Value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    public void Get_ReturnsNullCommit_WhenMissingOrBlank_OPS02(string? commit)
    {
        var ok = Assert.IsType<OkObjectResult>(Create(commit).Get().Result);
        Assert.Equal(new HealthResponse("ok", null), ok.Value);
    }

    [Fact]
    public void Controller_IsAnonymousAndOnlyDependsOnConfiguration_OPS02()
    {
        var type = typeof(HealthController);
        Assert.NotNull(Attribute.GetCustomAttribute(type, typeof(AllowAnonymousAttribute)));

        var ctor = Assert.Single(type.GetConstructors());
        Assert.Equal([typeof(IConfiguration)], ctor.GetParameters().Select(p => p.ParameterType));
    }
}
