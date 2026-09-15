# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["Natillera.Api.csproj", "./"]

RUN dotnet restore "Natillera.Api.csproj"

COPY . .

RUN dotnet publish "Natillera.Api.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


# ---------- Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Natillera.Api.dll"]