<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="Natillera.Frontend/public/logo-gallego-nanclares-invertido.png" />
    <img src="Natillera.Frontend/public/logo-gallego-nanclares.png" alt="Gallego Nanclares" height="72" />
  </picture>
</p>

<h3 align="center">Natillera Gallego Nanclares</h3>
<p align="center"><em>Familia que ahorra junta, prospera junta.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white" alt=".NET 10" />
  <img src="https://img.shields.io/badge/C%23-ASP.NET%20Core-239120?logo=csharp&logoColor=white" alt="C# / ASP.NET Core" />
  <img src="https://img.shields.io/badge/EF%20Core-10-6C3483" alt="EF Core 10" />
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 18" />
  <img src="https://img.shields.io/badge/JWT-auth-000000?logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <br />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white" alt="React Router 7" />
  <br />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/Nginx-static%20hosting-009639?logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/xUnit-tests-5E1F87" alt="xUnit" />
  <img src="https://img.shields.io/badge/Vitest-tests-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/license-proprietary-lightgrey" alt="Proprietary" />
</p>

---

> **This is not an open-source project.** The source code is private property of its owner and is shared here only to describe what the application is, how it works and how it is built. No license is granted to use, copy, modify or distribute it. All rights reserved.

## What is it?

A **natillera** is an informal, community-based savings and lending group, very common in Colombia. Every month each member contributes a fixed fee into a common fund. That money is lent back to members at an agreed interest rate and invested in products that the group sells together. The earnings stay in the group and are shared among its members.

This application replaces the notebook and spreadsheet that the Gallego Nanclares family used to run their natillera. Its core value is **financial data integrity**: every peso that comes in or goes out is recorded, traceable and never silently deleted, and every balance is derived from those records instead of being typed in by hand.

## Features

| Area | What it does |
|---|---|
| **Authentication** | JWT login with two roles: **Admin** (manages the natillera) and **Member** (read-only). Inactive users cannot sign in, and their open sessions stop working immediately. |
| **Dashboard** | Available money in the fund, total balance, loan and activity earnings, each member's savings (paid fees + activity earnings + share of interest), pending-fee reminders, top 10 sellers and recent movements. |
| **Members** | Create, edit, activate and deactivate members. A member with pending obligations (fees, loans, interest or activity assignments) cannot be deactivated. Detailed view with savings, pending fees and transaction history. |
| **Monthly fees** | Register fees as *Pending* or *Paid*, mark them as paid and cancel them. One active fee per member and month. |
| **Loans** | Loans to members with principal payments and interest records. A payment can never exceed the outstanding principal; a loan is settled automatically when its principal and pending interest reach zero. |
| **Activities** | Group sales: the fund buys units, assigns them to members and records each sale when it is paid. Tracks cost, outstanding collections, gross and net profit. An activity closes only when all its units are assigned and paid. |
| **Transactions** | Complete, filterable ledger of incomes and expenses. Each business entity owns exactly one transaction. |
| **Audit log** | Admin-only history of every create, update and cancel, with the old and new value and the user who made the change. |
| **Landing page** | Public page explaining what a natillera is, how a month works and how to join (via WhatsApp). |

## Business rules at a glance

- **Money is always `decimal`**, never floating point.
- **Balances are derived, never stored.** The available money is the sum of incomes minus expenses of all non-cancelled transactions.
- **Nothing is physically deleted.** "Deleting" a fee, loan, payment, interest, activity or assignment sets it to *Cancelled*, and its transaction is flagged as cancelled so it no longer counts towards any balance.
- **One transaction per business entity.** A transaction is never edited directly; it mirrors its entity. Pending items (fees, interest, activity assignments) have no transaction until they are paid.
- **Every mutation is atomic and audited.** The entity, its transaction and its log entry are saved in a single database transaction (Unit of Work).
- **Interest is shared.** Paid loan interest is split equally among active members.

## Architecture

The system is a **modular monolith**: a single deployable backend organised with **Clean Architecture**, a single-page frontend, and a PostgreSQL database, all wired together with Docker Compose.

```
┌──────────────────────────┐      REST / JSON + JWT      ┌──────────────────────────────┐      EF Core      ┌──────────────┐
│  Natillera.Frontend      │  ─────────────────────────▶ │  Natillera.Backend           │  ───────────────▶ │  PostgreSQL  │
│  React SPA (Nginx :3000) │                             │  ASP.NET Core API (:8080)    │                   │  (:5432)     │
└──────────────────────────┘                             └──────────────────────────────┘                   └──────────────┘
```

### Backend layers

Dependencies point inwards: business rules never depend on infrastructure.

| Layer | Folder | Responsibility |
|---|---|---|
| **Domain** | `Natillera.Backend/Domain` | Entities with their invariants (`Loan`, `MonthlyPayment`, `Activity`, `Transaction`, `Log`, …), enums and domain exceptions. No framework dependencies. |
| **Application** | `Natillera.Backend/Application` | Use cases (services), request/response contracts and the interfaces the domain needs (repositories, `IUnitOfWork`, security). |
| **Infrastructure** | `Natillera.Backend/Infrastructure` | EF Core `DbContext`, configurations, migrations, repositories, Unit of Work, JWT and BCrypt implementations, admin seeding. |
| **Presentation** | `Natillera.Backend/Presentation` | REST controllers, authorization by role and mapping of domain errors to HTTP status codes. |

### Frontend structure

Feature-based React application:

```
Natillera.Frontend/src
├── app/          # Routing, route guards, page titles
├── features/     # One folder per feature: api/, model/, pages/, components/
│   ├── auth  dashboard  members  monthlyPayments  loans
│   ├── activities  transactions  audit  landing
└── shared/       # API client, layout (AppShell), UI components, formatters
```

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | .NET 10, ASP.NET Core Web API, Entity Framework Core 10, Npgsql, JWT Bearer authentication, BCrypt, Swagger (development only) |
| Database | PostgreSQL 18 |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7 |
| Infrastructure | Docker, Docker Compose, Nginx (serves the built SPA) |
| Testing | xUnit (backend domain and application layers), Vitest (frontend logic) |

## Getting started

### Prerequisites

- [Docker](https://www.docker.com/) with Docker Compose
- Optional, to run outside Docker or to run the tests: [.NET SDK 10](https://dotnet.microsoft.com/) and [Node.js 22](https://nodejs.org/)

### Run with Docker Compose

1. Create the environment file from the template and fill in your own values (see [Environment variables](#environment-variables)):
   ```bash
   cp .env.example .env
   cp Natillera.Frontend/.env.example Natillera.Frontend/.env
   ```
2. Build and start the stack:
   ```bash
   docker compose up -d --build
   ```
3. Open the app:

   | Service | URL |
   |---|---|
   | Web app | http://localhost:3000 |
   | API | http://localhost:8080 |
   | Swagger (development) | http://localhost:8080/swagger |
   | PostgreSQL | `localhost:5432` |

On startup in the `Development` environment the API applies the database migrations automatically and creates the administrator account defined in `.env`. Sign in with `NATILLERA_ADMIN_EMAIL` / `NATILLERA_ADMIN_PASSWORD`.

### Run locally without Docker

```bash
# Database only
docker compose up -d postgres

# Backend (reads ../.env automatically)
cd Natillera.Backend
dotnet run

# Frontend
cd Natillera.Frontend
npm install
npm run dev        # http://localhost:5173
```

## Environment variables

### Root `.env` (backend and database)

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_DB` | Database name | `natillera` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `CORS_ORIGINS` | Comma-separated origins allowed to call the API | `http://localhost:5173,http://localhost:3000` |
| `NATILLERA_ADMIN_EMAIL` | Email of the administrator created on first start | `admin@natillera.local` |
| `NATILLERA_ADMIN_PASSWORD` | Password of that administrator | *(choose a strong one)* |
| `NATILLERA_ADMIN_FIRST_NAME` | Administrator first name | `System` |
| `NATILLERA_ADMIN_LAST_NAME` | Administrator last name | `Administrator` |
| `NATILLERA_ADMIN_PHONE` | Administrator phone | `0000000000` |
| `NATILLERA_DEFAULT_MEMBER_PASSWORD` | Initial password assigned to new members | *(choose a strong one)* |
| `NATILLERA_MIN_MONTHLY_PAYMENT` | Minimum amount accepted for a monthly fee | `50000` |
| `JWT_SECRET` | Signing key for access tokens — **at least 32 bytes** | *(long random string)* |
| `JWT_ISSUER` | Token issuer | `Natillera.Api` |
| `JWT_AUDIENCE` | Token audience | `Natillera.Client` |
| `JWT_EXPIRATION_MINUTES` | Token lifetime in minutes | `60` |

When running with Docker Compose, the connection string is built from the `POSTGRES_*` variables. Outside Docker the API uses `ConnectionStrings:DefaultConnection` from `appsettings.json` (or the `ConnectionStrings__DefaultConnection` environment variable).

### `Natillera.Frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the API. It is embedded at build time, so rebuild the frontend after changing it. | `http://localhost:8080` |

> Never commit real `.env` files. Only the `.env.example` templates belong in the repository.

## Testing

The test suites are deterministic and need no database, Docker or network access, so they can run in any CI pipeline.

```bash
# Backend — from the repository root
dotnet restore Natillera.sln
dotnet build Natillera.sln -c Release --no-restore
dotnet test Natillera.sln -c Release --no-build

# Frontend — from Natillera.Frontend
npm ci
npm run lint
npm test
npm run build
```

- **`Natillera.Backend.Tests`** (xUnit) covers domain invariants (fees, loans, interest, activities, transactions) and application services (fees, loans, activities, member deactivation, interest sharing, authentication) using in-memory fakes.
- **Frontend tests** (Vitest) cover the financial summaries of loans and activities, currency and date formatting, and API error messages.

## Repository structure

```
.
├── Natillera.Backend/         # ASP.NET Core API (Domain, Application, Infrastructure, Presentation)
├── Natillera.Backend.Tests/   # xUnit unit tests
├── Natillera.Frontend/        # React SPA
├── docs/                      # Architecture decisions, planning and data model diagrams
├── docker-compose.yml
├── Natillera.sln
└── .env.example
```

## License

Copyright © 2026 Natillera Gallego Nanclares. All rights reserved.

This repository is **not open source**. It is published for informational purposes only; no permission is granted to use, copy, modify, merge, publish, distribute, sublicense or sell any part of it.
