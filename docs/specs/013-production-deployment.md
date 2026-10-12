# 013 - Production deployment readiness

- **Status:** Implemented (backend)
- **Owner decision date / reference:** 2026-10-12 (devops phase 1 analysis; owner decisions: Render free for API + SPA, Neon free for PostgreSQL, CI/CD with GitHub Actions, migrations through an opt-in startup flag, external keep-alive ping to `/health`, public repository, no automated database backups - manual backups by the owner)
- **Related rules:** AUTH-07 (changed), OPS-01, OPS-02, OPS-03, OPS-04 (new), ADR-019

## Problem / goal
The application only runs on the local Docker stack: migrations and the admin account are created only in Development, there is no health endpoint for the hosting platform, and HTTPS redirection does not fit behind a TLS-terminating proxy. This spec covers the minimum application changes so the API can run in production on Render with the database on Neon.

## User stories
- As the owner, I want the API to create/upgrade the database schema and the admin account in production when I enable it explicitly, so that a fresh Neon database becomes usable without manual SQL.
- As the owner, I want a lightweight health endpoint, so that Render can check the service and an external monitor can keep it awake without waking the database.
- As the owner, I want the API to work correctly behind Render's HTTPS proxy.

## Scope
1. **Opt-in migrations and admin seed outside Development (OPS-01, AUTH-07).** At startup the API applies pending EF Core migrations and runs `AdminSeeder` when the environment is Development (unchanged) **or** when `NATILLERA_APPLY_MIGRATIONS` is `true` (case-insensitive). Any other value or absence = do nothing outside Development. The seeder stays idempotent (creates the admin only if the email does not exist). Missing or blank (empty/whitespace) `NATILLERA_ADMIN_*` values are treated the same way and fail with "Missing required environment variable: X". If a migration or the seed fails, the process fails to start (the platform keeps the previous version running).
2. **Health endpoint (OPS-02).** `GET /health`, anonymous, **never touches the database**. Response 200 `{ "status": "ok", "commit": "<RENDER_GIT_COMMIT or null>" }`.
3. **HTTPS at the edge (OPS-03).** HTTPS redirection is applied only in Development; in every other environment it is not applied (TLS is terminated by the hosting platform; the container only receives HTTP).
4. **Configuration contract.** Document in `.env.example` and the README: `NATILLERA_APPLY_MIGRATIONS`, `ConnectionStrings__DefaultConnection` format for Neon (Npgsql key=value with `SSL Mode=Require`), `PORT`, and which variables are secret / build-time / runtime.

## Out of scope
Infrastructure files (`render.yaml`, GitHub Actions workflows), creation of cloud resources and secrets: handled by `devops` with owner approval (ADR-019). Automated database backups (owner decision: manual backups, OPS-04). Integration tests against Postgres, login rate limiting, custom domain, "waking up server" UI message.

## Business rules
- **AUTH-07 (changed):** migrations + admin seed run automatically in Development, and in any other environment only when `NATILLERA_APPLY_MIGRATIONS=true`.
- **OPS-01:** migration flag behavior (above).
- **OPS-02:** `/health` is anonymous and database-free.
- **OPS-03:** HTTPS redirection only in Development.
- **OPS-04:** database backups are manual and owner-managed (accepted risk; procedure in the runbook).

## Data model changes
None (no new migrations).

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/health` | Anonymous | - | 200 `{ "status": "ok", "commit": string \| null }` |

## UI
None.

## Acceptance criteria
1. Given `ASPNETCORE_ENVIRONMENT=Production` and `NATILLERA_APPLY_MIGRATIONS` unset, When the API starts, Then no migration and no seed run.
2. Given `ASPNETCORE_ENVIRONMENT=Production`, `NATILLERA_APPLY_MIGRATIONS=true` and an empty database, When the API starts, Then all migrations are applied and the admin account from `NATILLERA_ADMIN_*` exists; restarting again changes nothing (idempotent).
3. Given `NATILLERA_APPLY_MIGRATIONS=true` and a missing or blank `NATILLERA_ADMIN_*` variable, When the API starts, Then startup fails with the existing "Missing required environment variable" error.
4. Given Development, When the API starts, Then migrations and seed run as before (flag not needed).
5. Given the API running (any environment), When `GET /health` is called without a token, Then 200 with `status: "ok"` and `commit` equal to `RENDER_GIT_COMMIT` (or null), and no database query is executed (works even with the database stopped).
6. Given any environment other than Development, When a request arrives over HTTP from the proxy, Then it is not redirected (no 307 to https).
7. `dotnet test Natillera.sln` passes; existing behavior of all other endpoints unchanged.

## Test plan
- Unit tests for the pure decision "should apply migrations" (environment name + flag value -> bool) referencing OPS-01/AUTH-07.
- Manual on the Docker dev stack: criteria 4, 5 (also with the `postgres` container stopped). Criteria 1, 2, 3, 6 verified by running the backend container with `ASPNETCORE_ENVIRONMENT=Production` against the local dev database or a QA database configuration agreed with the owner (no throwaway databases), and finally on Render/Neon by `devops`.

## Open questions
None. Owner decisions 2026-10-12: HTTPS redirection only in Development; blank admin variables treated as missing; the app uses Neon's **direct** connection string (pooler not needed at this scale; migrations run at startup); criterion 2 (empty database) is verified on the first Neon deploy.
