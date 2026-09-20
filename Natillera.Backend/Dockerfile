# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["Natillera.Backend.csproj", "./"]

RUN dotnet restore "Natillera.Backend.csproj"

COPY . .

RUN dotnet publish "Natillera.Backend.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


# ---------- Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Natillera.Backend.dll"]
