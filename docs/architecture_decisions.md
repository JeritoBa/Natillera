# Architecture Decisions

Decision log in ADR style. Each entry: **Status**, **Context**, **Decision**, **Consequences / trade-offs**. Decisions ADR-001 .. ADR-007 are the original decisions (kept as made at the start of the project); ADR-008 onwards were made during development. To change a decision, add a new ADR that supersedes the old one instead of editing history.

Index

| ADR | Title | Status |
|---|---|---|
| 001 | Modular monolith | Accepted |
| 002 | REST API between frontend and backend | Accepted |
| 003 | React single-page frontend | Accepted |
| 004 | C# / ASP.NET Core backend | Accepted |
| 005 | Clean Architecture | Accepted (refined by ADR-008) |
| 006 | PostgreSQL | Accepted |
| 007 | Initial indexes | Accepted (extended by ADR-013) |
| 008 | Clean Architecture layers inside a single backend project | Accepted |
| 009 | Unit of Work for atomic financial operations | Accepted |
| 010 | Cancel, never delete; one transaction per entity | Accepted |
| 011 | Pending items have no transaction | Accepted |
| 012 | JWT revocation through `OnTokenValidated` | Accepted |
| 013 | Partial unique index for monthly payments | Accepted |
| 014 | Frontend feature folders | Accepted |
| 015 | Test strategy: xUnit with fakes, Vitest | Accepted (integration tests pending) |
| 016 | Docker Compose development stack | Accepted |
| 017 | Enums persisted as strings | Accepted |
| 018 | Hosting and production strategy | Open |

---

## ADR-001 Modular monolith

- **Status:** Accepted
- **Context:** About 100 active users at most. Microservices would add operational complexity (deployment, distributed consistency) that the scale does not justify, and financial consistency is easier inside one database transaction.
- **Decision:** A single deployable backend, logically separated by layers and by feature (folders per module), so a module could be extracted later.
- **Consequences:** Simplicity and consistency now; no independent scaling or deployment.

## ADR-002 REST API between frontend and backend

- **Status:** Accepted
- **Context:** The system has a clear frontend/backend separation, and the frontend retrieves and manipulates resources.
- **Decision:** A REST/JSON API with JWT bearer authentication.
- **Consequences:** More requests or larger payloads than GraphQL, but the complexity is not significant for the current scope.

## ADR-003 React single-page frontend

- **Status:** Accepted
- **Context:** The product is an interactive application (dynamic UI, reusable components, client-side state).
- **Decision:** React (currently 19) with TypeScript, Vite, Tailwind CSS and React Router.
- **Consequences:** More complexity than a server-rendered UI, accepted for the benefits of an interactive SPA.

## ADR-004 C# / ASP.NET Core backend

- **Status:** Accepted
- **Context:** A business/financial application values strong static typing, security, robustness and maintainability.
- **Decision:** C# with ASP.NET Core (.NET 10) and EF Core. Authentication uses JWT bearer tokens with BCrypt password hashes (ASP.NET Identity was considered in the original plan; the project implements its own simple `User` + JWT).
- **Consequences:** More verbose than Node.js or Python; maintainability, type safety and reliability are prioritized.

## ADR-005 Clean Architecture

- **Status:** Accepted (see ADR-008 for how it is laid out)
- **Context:** Business rules (financial integrity) are the most important part of the system.
- **Decision:** Dependencies point inward: Domain <- Application <- Infrastructure/Presentation. Business rules live in domain entities and application services and never depend on EF Core or ASP.NET.
- **Consequences:** More upfront structure for less coupling and easier evolution.

## ADR-006 PostgreSQL

- **Status:** Accepted
- **Context:** A transactional, relational system where data integrity and consistency matter more than schema flexibility; open-source licensing. The original plan left SQL Server as an open alternative.
- **Decision:** PostgreSQL (18 in Docker) through Npgsql/EF Core. The alternative was dropped.
- **Consequences:** Partial unique indexes and transactional DDL are available; hosting must offer Postgres (see ADR-018).

## ADR-007 Initial indexes

- **Status:** Accepted
- **Context:** Indexes were defined from the most necessary expected queries.
- **Decision:** `User.Email` UNIQUE; `LoanPayment.LoanId`; `Performance.LoanId`; `ActivityAssignment.ActivityId`; `ActivityAssignment.UserId`; `MonthlyPayment(UserId, Year, Month)` UNIQUE (later made partial, ADR-013).
- **Consequences:** Extended since: unique `TransactionId` on every entity that owns a transaction (ADR-010), `Transaction.OccurredAt`, and on `Log`: (`EntityType`,`EntityId`), `OccurredAt`, `UserId`.

## ADR-008 Clean Architecture layers inside a single backend project

- **Status:** Accepted
- **Context:** A solo developer and a small domain. Separate projects per layer would add ceremony (references, DI wiring) for little benefit.
- **Decision:** One project `Natillera.Backend` with top-level folders `Domain`, `Application`, `Infrastructure`, `Presentation`. The boundary is enforced by convention and review (Domain and Application should not reference EF Core or ASP.NET types; known exceptions today: validation attributes on request contracts, `IConfiguration` in `UserService`, and `DbUpdateException` handling in `MonthlyPaymentService`).
- **Consequences:** Faster to work with; boundaries are not compiler-enforced. A test project (`Natillera.Backend.Tests`) references the backend and tests Domain and Application with fakes. Splitting into projects remains possible later.

## ADR-009 Unit of Work for atomic financial operations

- **Status:** Accepted
- **Context:** Each financial change touches the entity, its `Transaction` and a `Log`; a partial save would corrupt the balance and the audit trail.
- **Decision:** `IUnitOfWork.ExecuteInTransactionAsync` (EF implementation: `EfUnitOfWork`) wraps the operation in a single database transaction and calls `SaveChanges` once; any exception rolls everything back. Repositories add to the context but do not save.
- **Consequences:** All-or-nothing writes. Not yet protected against concurrent edits (RowVersion is pending, rule FIN-11).

## ADR-010 Cancel, never delete; one transaction per business entity

- **Status:** Accepted
- **Context:** Financial records must never be silently deleted and every movement must be traceable. The original data model allowed shared or free transactions.
- **Decision:** (a) "Delete" sets the entity status to `Cancelled` and the linked `Transaction.IsCancelled = true`; cancelled transactions are excluded from balances but remain visible. (b) Each business entity owns exactly one `Transaction` (1:1, unique foreign key); the transaction mirrors the entity and is never edited directly. (c) Every create/update/cancel writes one `Log` (action `Delete` for cancel) in the same Unit of Work. (d) Cancelled records are terminal.
- **Consequences:** History is preserved; queries must filter by status/`IsCancelled`; re-registering something (e.g. the same fee period) creates a new row.

## ADR-011 Pending items have no transaction

- **Status:** Accepted
- **Context:** A pending fee, pending loan interest or an activity assignment not yet collected is not a money movement. A transaction at creation would inflate the balance.
- **Decision:** `MonthlyPayment.TransactionId`, `Performance.TransactionId`, `ActivityAssignment.TransactionId` and their `PaidAt` are nullable. The Income transaction is created when the item is marked Paid. `Paid -> Pending` is forbidden.
- **Consequences:** The balance only reflects real money; pending obligations are computed from the entity status (used for debt detection and deactivation checks).

## ADR-012 JWT revocation through `OnTokenValidated`

- **Status:** Accepted
- **Context:** A deactivated member must lose access immediately, but JWTs are stateless and valid until expiry.
- **Decision:** In `Program.cs`, `JwtBearerEvents.OnTokenValidated` loads the user by id and fails authentication if the user is missing or inactive. The frontend treats a 401 with a stored token as an invalid session: logs out and shows a notice.
- **Consequences:** One lightweight query per authenticated request (acceptable at this scale); no token blacklist or refresh-token store needed.

## ADR-013 Partial unique index for monthly payments

- **Status:** Accepted
- **Context:** One fee per member and month must be guaranteed even under concurrent requests, yet a cancelled fee must not block re-registering the same period.
- **Decision:** Unique index on (`UserId`, `Year`, `Month`) with filter `"Status" <> 'Cancelled'`, plus a service-level check; a `DbUpdateException` from the index is mapped to the same business error.
- **Consequences:** Postgres-specific syntax in the EF configuration; the index itself is not covered by the current unit tests.

## ADR-014 Frontend feature folders

- **Status:** Accepted
- **Context:** The UI grows by feature (members, loans, activities...).
- **Decision:** `src/features/<feature>/{api,model,pages,components}` for each feature, with `src/shared` for the API client, layout, UI primitives and formatters, and `src/app` for routing. Pure calculations live in `model/` so they can be unit tested. Path alias `@/`. Do not name a folder `logs` (gitignore trap); the audit feature is `audit`.
- **Consequences:** Features are cohesive and independently testable. Some legacy files remain (see technical debt in AGENTS.md).

## ADR-015 Test strategy: xUnit with fakes, Vitest

- **Status:** Accepted (integration tests pending)
- **Context:** Business rules are the core value and must be testable fast and deterministically, without Docker or network.
- **Decision:** Backend: `Natillera.Backend.Tests` (xUnit) tests Domain entities and Application services with in-memory fakes (`Fakes/Fakes.cs`) - no database. Frontend: Vitest for pure logic (summaries, labels, formatters, API error mapping). Integration/E2E validation is done by the `validator` agent against the running Docker dev stack (no throwaway databases).
- **Consequences:** Fast feedback and CI-friendly. Not covered: EF repositories against Postgres, controllers, migrations, the JWT middleware. Adding an integration suite (for example with Testcontainers) is the next testing step.

## ADR-016 Docker Compose development stack

- **Status:** Accepted
- **Context:** Reproducible local environment with the same database engine as production.
- **Decision:** `docker-compose.yml` with `postgres` (postgres:18-alpine, :5432), `backend` (ASP.NET, `ASPNETCORE_ENVIRONMENT=Development`, :8080) and `web` (Nginx serving the built SPA, :3000). Configuration through `.env` (see `.env.example`). In Development the API applies migrations and seeds the admin account on startup.
- **Consequences:** One command to run everything; containers must be rebuilt after code changes. The stack is a development stack, not a production definition.

## ADR-017 Enums persisted as strings

- **Status:** Accepted
- **Context:** Readable data and safety against reordering of enum members.
- **Decision:** EF `HasConversion<string>()` for all enums; the API serializes enums as strings (`JsonStringEnumConverter`). Log and transaction types are therefore stored as `'MonthlyPayment'`, `'ActivityAssignment'`, etc.
- **Consequences:** Renaming an enum member requires a data migration (as was done when the log type `ActivitySale` became `ActivityAssignment`).

## ADR-018 Hosting and production strategy

- **Status:** Open
- **Context:** The original plan targeted Vercel's free tier. The frontend is a static SPA, but the backend is a containerized .NET API that also needs a managed PostgreSQL database, so the hosting options must be re-evaluated (not yet verified). Migrations and admin seeding only run in Development today.
- **Decision:** Not decided. To be resolved in the testing and deployment phase.
- **Consequences:** Needs: a host for API + Postgres + static SPA, a production migration strategy, secrets management, backups, HTTPS, and a CI workflow (none exists yet).

---

## Questions to Solve

Original questions with their current resolution.

| Question | Resolution |
|---|---|
| Which components should an application have if it is a monolith? | **Resolved.** Layers Domain / Application / Infrastructure / Presentation in one project (ADR-008), feature folders in the frontend (ADR-014). |
| How to define a good MVP? | **Resolved.** The MVP (auth, members, monthly payments, debt/balance, transactions, audit) is done and went beyond: loans, activities, dashboard, landing and responsive UI are implemented too. See AGENTS.md "Current status". |
| How to make sure of the deployment? | **Open.** See ADR-018. |
| How to manage future add-ons that break the current structure (for example payments)? | **Partially resolved.** Spec-driven development: new features start with a spec and rule IDs (docs/specs, docs/business-rules.md). In-app payments remain a separate integration project. |
| Why choose C# instead of Node.js, Java or Python? | **Resolved.** ADR-004. |
| Should tests be required to mark a user story as finished? | **Resolved.** Yes: the Definition of Done in AGENTS.md requires happy path, failure paths and business rules tested; tests reference rule IDs when practical. |
| By the last project made with AI, what can I do better? | **Resolved by process.** Planner -> owner approval -> build -> validator workflow, implement only what is asked, specs and rule catalogue as shared context (AGENTS.md). |
