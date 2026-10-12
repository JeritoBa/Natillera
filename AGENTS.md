# AGENTS.md - Natillera Project

Single entry point for any AI coding agent (Claude Code, Copilot, Cursor, etc.). Read this first, then the documents it links. The owner talks to agents in **Spanish**; all repository documentation and code are in **English**.

Last verified against the code: backend 267 tests and frontend 78 tests passing.

---

## 1. What this project is

A **natillera** is an informal community savings/loan group (very common in Colombia). Members pay a monthly fee into a common fund; the fund lends money to members at interest and invests in activities that members sell; the earnings are shared. This app (family group "Gallego Nanclares") replaces an iPhone note and a generic money app that caused inconsistent balances.

**Users:** the **Admin** (manager; registers everything) and **Members** (see balances and transactions, read-only).

### Non-negotiable principle

> **Financial data integrity and consistency come before speed, features, or convenience.**

The financial rules in short form (full catalogue with IDs: [docs/business-rules.md](docs/business-rules.md)):

- Money is `decimal` (C#) - never float/double.
- Every business entity that moves money has exactly **one Transaction** (1:1). A Transaction is never edited directly; it mirrors its entity.
- Every create/update/cancel writes exactly **one Log** (old value -> new value, user from the JWT) in the **same Unit of Work** (one DB transaction) as the entity and its Transaction.
- **Nothing is physically deleted.** "Delete" = status `Cancelled`; the Transaction gets `IsCancelled = true` and is excluded from all balances. Cancelled records are terminal.
- **Pending items have no Transaction** (monthly payment, loan interest, activity assignment). The Income Transaction is created when marked Paid. `Paid -> Pending` is never allowed.
- A loan payment can never exceed the outstanding principal.
- **Balances are derived** from non-cancelled transactions and never stored or edited. If a feature seems to need editing a balance, stop and ask.
- Optimistic concurrency (`RowVersion`) is planned, not implemented.

---

## 2. Current status

Phase: **MVP and more are done; next is testing and deployment.** Hosting is undecided. The board/owner is the source of truth for status; this section reflects the code.

| Area | State |
|---|---|
| Authentication (JWT, roles, inactive users blocked, tokens revoked on deactivation) | Implemented |
| Members (CRUD, activate/deactivate with obligation check, admin detail page) | Implemented |
| Monthly payments (Pending/Paid/Cancelled, one live fee per member/month) | Implemented |
| Debt / pending-payment notices | Implemented (pending fees on dashboard and member detail) |
| Transactions ledger + detail, derived balance | Implemented |
| Audit log (Admin-only list and detail) | Implemented (detail enrichment only for monthly payments) |
| Loans, loan payments, loan interest (`Performance`) | **Implemented** (no longer Post-MVP) |
| Activities and assignments, sellers ranking | **Implemented** (no longer Post-MVP) |
| Dashboard (admin and member variants), member savings/earnings | Implemented |
| Public landing page, mobile-responsive UI | Implemented |
| Unit tests (backend and frontend) | Implemented; integration tests pending |
| **Not implemented** | In-app payments (separate integration project, high risk), member loan requests/approval workflow, `ActivitySale` entity (the assignment covers it), RowVersion concurrency, CI workflow, production deployment |

The old "US-08 blocked" note is resolved: member savings = paid fees + activity earnings + interest share (DASH-04). Specs per feature: [docs/specs/README.md](docs/specs/README.md).

---

## 3. Architecture and tech stack

Decisions and their rationale: [docs/architecture_decisions.md](docs/architecture_decisions.md) (ADR style). Do not relitigate without a strong reason; add a new ADR to supersede one.

- **Modular monolith**, **Clean Architecture** in a single backend project (`Domain` <- `Application` <- `Infrastructure` / `Presentation`; dependencies point inward, the Domain has no framework dependencies).
- **REST/JSON API + JWT bearer**; React SPA; PostgreSQL; Docker Compose.
- Controllers map `DomainException` to HTTP codes (message containing "not found" -> 404, "already exists" -> 409 where used, otherwise 400); the message body is `{ "message": "..." }` in English.

| Layer | Technologies (versions as in the project files) |
|---|---|
| Backend | .NET 10 (`net10.0`), ASP.NET Core Web API, EF Core 10.0.12, Npgsql EF provider 10.0.3, JWT Bearer 10.0.9, BCrypt.Net-Next 4.0.3, DotNetEnv 3.1.1, Swashbuckle 10.0.1 (Swagger, Development only). No ASP.NET Identity: own `User` + JWT. |
| Database | PostgreSQL 18 (`postgres:18-alpine`). Enums stored as strings. |
| Frontend | React 19.2, TypeScript ~6.0, Vite 8, Tailwind CSS 4, React Router 7 (`react-router-dom` 7.18), Node 22 |
| Testing | xUnit 2.9.3 (+ in-memory fakes), Vitest 5 |
| Infra | Docker, Docker Compose, Nginx serving the built SPA |

### Repository structure

```
.
├── AGENTS.md                      # this file
├── README.md                      # public overview, setup, env vars
├── Natillera.sln                  # solution (backend + tests)
├── docker-compose.yml             # postgres + backend + web
├── .env.example                   # root env template (real .env is not committed)
├── docs/
│   ├── business-rules.md          # rule catalogue with stable IDs
│   ├── specs/                     # one spec per feature + README (index, template)
│   ├── architecture_decisions.md  # ADRs
│   ├── arrival_planning.md        # historical original plan
│   ├── development_planning.md    # historical original plan
│   └── diagrams/                  # entities.txt, flow_diagram.txt, ER image/workbench
├── Natillera.Backend/
│   ├── Domain/                    # Entities, Enums, Exceptions (business invariants)
│   ├── Application/               # services, contracts, repository/UoW interfaces (per module)
│   ├── Infrastructure/            # EF DbContext, Configurations, Migrations, Repositories, EfUnitOfWork, JWT, BCrypt, AdminSeeder
│   ├── Presentation/Controllers/  # REST controllers
│   └── Program.cs                 # DI, JWT (incl. OnTokenValidated), CORS, Swagger, dev migrate+seed
├── Natillera.Backend.Tests/       # xUnit: Domain/, Application/, Fakes/
└── Natillera.Frontend/
    ├── src/app/                   # routing (App.tsx), document title
    ├── src/features/<feature>/    # api/, model/ (pure logic + tests), pages/, components/
    │   └── auth dashboard members monthlyPayments loans activities transactions audit landing
    ├── src/shared/                # api client, layout (AppShell), ui primitives, formatters, types
    ├── public/                    # logos
    └── design/                    # original logo files
```

---

## 4. How to run, test and migrate

**Run (Docker, recommended).** Create `.env` from `.env.example` (and `Natillera.Frontend/.env` from its example), then:

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| Web app (Nginx) | http://localhost:3000 |
| API | http://localhost:8080 (Swagger at `/swagger`, Development only) |
| PostgreSQL | localhost:5432 (database `natillera`) |

Rebuild after code changes: `docker compose up -d --build backend web`. In `Development` the API applies migrations and seeds the admin (`NATILLERA_ADMIN_*`) on startup. Environment variables are documented in [README.md](README.md#environment-variables) (including `JWT_*`, `NATILLERA_MIN_MONTHLY_PAYMENT`, `NATILLERA_DEFAULT_MEMBER_PASSWORD`, `CORS_ORIGINS`, `VITE_API_URL`). Never commit real `.env` files.

**Test.**

```bash
dotnet test Natillera.sln          # backend, ~267 tests, no DB/Docker needed
cd Natillera.Frontend && npm test  # Vitest, ~78 tests, pure logic
cd Natillera.Frontend && npm run lint && npm run build
```

Not covered by automated tests: EF repositories against Postgres, controllers, migrations, the JWT middleware (integration tests are pending).

**Migrations (EF Core).** From `Natillera.Backend`:

```bash
dotnet ef migrations add <Name> -o Infrastructure/Persistence/Migrations
```

Applied automatically **only in Development** at startup. Production migration strategy is an open item. Never edit an applied migration; add a new one. Renaming persisted enum values needs a data migration.

**Knowledge graph (graphify).** The repo is indexed with [graphify](https://github.com/Graphify-Labs/graphify) into `graphify-out/` (git-ignored, regenerable). Before exploring code, query the graph instead of grepping or reading whole files:

```bash
graphify query "<question>"       # scoped subgraph for a question
graphify explain "<concept>"      # a node and its neighbors (e.g. "MonthlyPaymentService")
graphify path "<A>" "<B>"         # how two concepts connect
graphify update .                 # after code changes (AST only, no LLM cost)
```

Rules for agents:
- For any codebase question, run `graphify query` first (when `graphify-out/graph.json` exists); use `path` for relationships and `explain` for a focused concept. They return a scoped subgraph, much smaller than grep output or `GRAPH_REPORT.md`. Raise `--budget` if the answer is truncated.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of browsing raw sources.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture reviews or when query/path/explain do not surface enough context.
- Read raw files only after the graph has oriented you, or to modify/debug specific lines. Include this rule in every subagent prompt that explores code.
- After modifying code, run `graphify update .` to keep the graph current.

`graphify-out/GRAPH_REPORT.md` summarizes hubs and communities. A Claude Code `PreToolUse` hook (`.claude/settings.json`) reminds agents to use the graph before `Grep`/`Read`. When docs or specs change substantially, rebuild the semantic part with `/graphify . --update`. Exclusions live in `.graphifyignore`. If `graphify-out/` is missing (fresh clone), run `/graphify .` once.

---

## 5. Working agreements

### Agent workflow

```
planner (read-only plan) -> owner answers questions / approves -> build -> validator
UI/UX changes: ux-designer (read-only spec) -> owner -> build -> screenshots / validator
Infrastructure / CI/CD / deployment: devops (infra map, costs, plan) -> owner approves -> devops implements -> owner approves commit/push/deploy -> devops verifies production
```

Agent definitions live in the owner's user folder (`~/.claude/agents`: planner, build, validator, reviewer, ux-designer, devops). Follow the role you were given; `build` implements, `validator` validates independently, `devops` owns infrastructure, CI/CD and deployment (minimum cost without compromising data integrity; never commits, pushes, deploys or changes cloud resources without explicit owner approval; application code changes needed by infrastructure go through `planner`/`build`).

### Rules for every agent

- **Language:** talk to the owner in Spanish; write code, comments, docs and commit messages in English.
- **Implement only what is asked.** Propose extras in a short "not included" list instead of building them. Ask before touching the backend in a frontend task and vice versa.
- **No commits** unless the owner asks. Never revert changes you did not make; the working tree may contain the owner's uncommitted work.
- **Validate on the running Docker dev stack** (DB `natillera`, backend :8080, frontend :3000). No throwaway databases. Rebuild containers after code changes. Test data created while validating uses names starting with **"QA ..."**.
- **`.gitignore` trap:** `**/logs/` and `logs` are ignored. Never name a folder `logs`/`Logs` (the audit feature uses `audit`).
- **Respect Clean Architecture boundaries;** do not leak EF Core/ASP.NET types into Domain.
- **Think about the audit log first:** every financial mutation = entity change + Transaction change + one Log, in the same `IUnitOfWork.ExecuteInTransactionAsync`.
- **Cancel, never delete.** The UI verb is **"Anular"**.
- **Do not build out-of-scope features:** in-app payments, member loan requests/approval. If a request maps to one, say so and propose deferring it.
- Verify the repository state (files, migrations, tests) instead of trusting any document, including this one.

### UI conventions

- Visual identity: green `#0c5c38`; fonts Outfit (headings), Inter (body), JetBrains Mono (figures); "ledger notebook" aesthetic; snout logo (`public/logo-gallego-nanclares.png`, inverted white version on green backgrounds).
- Negative amounts are shown only with a "-" sign (no red backgrounds). Currency COP without decimals.
- Backend error messages are English and are shown **as-is** (not translated).
- Detail pages: header with name + Badge, a green headline block with a `<dl>` breakdown, secondary cards, tables ordered by status, "Details" section at the end, loading / 404 / error-with-retry states, `document.title` with the entity name.
- Lists with dates filter by month using `startDate.slice(0, 7)`. Mobile (375 px): tables show the main cell (link to detail) + amount + actions, secondary data in a small line below; the eye/"Ver detalle" button is hidden on mobile.
- Landing is public, explains what a natillera is and how to join (WhatsApp link), example figures are always labeled fictitious, no real data.

---

## 6. Spec-driven development

From now on, **specs and rule IDs come before code**:

1. **Before implementing a feature or changing a rule,** create or update its spec in [`docs/specs`](docs/specs/README.md) (use the TEMPLATE there) and add/update the rule in [`docs/business-rules.md`](docs/business-rules.md) with a stable ID. The owner approves the spec/plan.
2. **`planner`** reads the spec and the relevant rules and produces the implementation plan; discrepancies between spec and code are reported, not guessed.
3. **`build`** implements the spec and the plan, adds tests, and updates the rule's "Enforced in" / "Tests" / "Status" columns.
4. **`validator`** checks the spec's **acceptance criteria** (Given/When/Then) against the Docker dev stack and reports which ones pass.
5. **Tests reference rule IDs** in their names or in a comment when practical (e.g. `// MP-04`). Rule IDs are never reused or renumbered.
6. If code and docs disagree, the owner decides which is right; fix the other and note it.

Rule areas: FIN (financial integrity), AUTH, MEM, MP (monthly payments), LOAN, ACT (activities), DASH (dashboard), TX/AUD (transactions, audit), UI.

---

## 7. Definition of Done (every story)

- **Spec/Rules:** spec and `business-rules.md` updated and approved before coding.
- **Domain:** business rules defined; domain model correct.
- **Backend:** use case, validation, authorization, API, error handling; one Transaction/Log discipline respected.
- **Database:** schema changes implemented, migration created and tested.
- **Frontend:** UI implemented, API integrated, loading/error/success states handled, mobile checked.
- **Testing:** happy path, important failure paths and business rules tested (rule IDs referenced); `dotnet test` and `npm test` pass; lint/build pass.
- **Verification:** acceptance criteria checked on the Docker dev stack.
- **Final:** works end-to-end, docs updated, committed only when the owner asks.

---

## 8. Known open items and technical debt

- Migrations and admin seeding run only in Development; **production strategy pending**. Hosting undecided (the original Vercel plan must be re-evaluated for the .NET API and PostgreSQL; see ADR-018).
- **No CI workflow yet.**
- **Integration tests pending** (repositories/EF against Postgres, controllers, migrations, JWT middleware, the partial unique index).
- **Interest rounding question (LOAN-10):** `Loan.CalculateMonthlyInterest` rounds `ToEven`, the per-member interest share rounds `AwayFromZero`; owner has not confirmed it is intentional (a characterization test documents current behavior). The method is not used by any service.
- **RowVersion optimistic concurrency** pending (FIN-11).
- Build warning **MSB3277** in the test project: EF Core Relational version mismatch (10.0.4 vs 10.0.12). Suggested fix: reference `Microsoft.EntityFrameworkCore.Relational` 10.0.12 in the backend csproj.
- Build warning **NU1903**: `Microsoft.OpenApi` vulnerability (transitive via Swashbuckle).
- `Activity.Finish()` is unused (status is automatic via `RefreshStatus`).
- Member create/update/status changes are not audited (MEM-08, open question).
- Audit log detail summary only covers monthly payments (AUD-02).
- Legacy frontend files not referenced by the router: `src/features/management/pages/ManagementPages.tsx`, `src/shared/components/CrudPage.tsx`, `src/shared/data/mockData.ts`.
- Business-error to HTTP status mapping relies on message text ("not found", "already exists").

---

## 9. Weekly review questions (for status/PR summaries)

1. **Product:** What can a real user do now that they couldn't do last week?
2. **Technical:** What technical debt or blocker was introduced?
3. **Quality:** What financial/business rule is still insufficiently tested?
4. **Planning:** What is the single most important deliverable for next week?

Original plan and milestones (M0-M12, historical): [docs/development_planning.md](docs/development_planning.md), [docs/arrival_planning.md](docs/arrival_planning.md).
