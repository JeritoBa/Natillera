using System.Reflection;

namespace Natillera.Backend.Tests.Fakes;

/// <summary>Sets private-setter properties (EF navigations) that production code only populates via EF Core.</summary>
internal static class Reflect
{
    public static T Set<T>(this T target, string property, object? value) where T : class
    {
        var prop = typeof(T).GetProperty(property, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException($"Property {property} not found on {typeof(T).Name}.");
        prop.SetValue(target, value);
        return target;
    }
}
