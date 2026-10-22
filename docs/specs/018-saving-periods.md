# 018 - Saving periods

- **Status:** Implemented (2026-10-21)
- **Owner decision date / reference:** 2026-10-21 (branch `v1.1.0`; target model in `../diagrams/entities.txt`, lines marked `[018]`)
- **Related rules:** PER-01..08 (new), MP-02, MP-04, MP-10, MP-11 (new), FIN-09, FIN-13, MEM-04, MEM-10, DASH-*, TX-01, AUD-*

> **This feature changes the logical structure of the application.** Every financial figure, list and check is scoped to one saving period (one year). Read PER-06 before touching any balance, list or guard.

## Problem / goal
A natillera runs by years: each year starts from zero and ends with a settlement. Today all data lives in one pool, so a new year would mix with the previous one. As a user or Admin, I want to choose the year whose data I see.

## User stories
- As an Admin or Member, I want to choose a saving period (year) in a Configuración view and see only that year's data.
- As an Admin, I want new records to go to the period I selected, and to keep editing records of past periods.
- As the developer, I want to add the period of each new year with a safe, versioned migration.

## Scope

### Model (PER-01, PER-02)
1. New entity **`SavingPeriod`**: `Id` (uuid), `Year` int, unique.
2. `MonthlyPayment`, `Loan`, `Activity`, `Transaction` and `Log` get a **required** `SavingPeriodId` FK (ON DELETE RESTRICT, indexed).
3. Children have no column of their own and belong to their parent's period: `LoanPayment`, `Performance` -> loan; `ActivityAssignment` -> activity. A Transaction or Log has the period of its source / audited entity (for a child, the parent's period).
4. `User` has no period: members exist across years.
5. **`MonthlyPayment.Year` is removed** (MP-11): a fee's year is its period's year. One non-cancelled fee per member / period / month (MP-04). The "Año" field of the fee form disappears; MP-10 offers the free months of the selected period.

### Creating periods (PER-01)
6. Nobody creates periods from the app: there is no endpoint and no UI for it. The developer adds the period of each new year with an **EF Core migration** (for example `AddSavingPeriod2027`, fixed `Id`), applied with the normal migration mechanism (OPS-01) and documented in the README runbook. Creating a period writes no Log.

### Selecting a period (PER-03, PER-04)
7. New view **Configuración** (`/settings`, Settings icon in the navigation, Admin and Member). It is a form with a select "Año" listing the existing periods (newest first) and a "Guardar" button; it is designed to receive more settings later.
8. The selection is stored **in the browser, per device**. Default: the period of the **current year**. If the current year has no period yet (e.g. 1 January before the developer adds it), the most recent existing period is used and the app shows a notice. A stored selection whose period no longer exists falls back to the default.
9. The app shows the selected year in the app shell, so the user always knows which year is on screen.
10. Every period-scoped request carries the header **`X-Saving-Id: <period id>`**. Period-scoped endpoints reject a request with a missing, malformed or unknown id with **400**. Not period-scoped: authentication, members CRUD, `GET /api/saving-periods`, `/health`.
11. The selection only decides which data is shown and to which period new records go. It never changes the application's behavior: records of any period, past ones included, can be created, edited and cancelled normally. There is no closing or locking of periods.

### Dates (PER-05)
12. The dates a user enters for a period-scoped record fall inside its period's year: loan start date and activity start date. System timestamps (`CreatedAt`, `PaidAt`, transaction `OccurredAt`) keep the real time of the operation and are not validated.
13. A record never moves to another period.

### Each period starts at 0 (PER-06, PER-07)
14. **Every balance and figure is computed within one period; nothing carries over from one year to the next.** This covers: available money (FIN-09) and its check (FIN-13), member savings, activity earnings, interest share, the dashboard (Admin and Member), top sellers, the member detail, pending obligations (MEM-10), the transactions ledger and the audit log list.
15. A record belongs to its period forever. A loan of 2026 that is still open in 2027 stays in 2026: its payments and interest are listed and counted only in 2026, so the 2026 figures keep moving after the year ends.
16. FIN-13 checks the available money **of the record's period**.
17. Exceptions (PER-07): deactivating a member (MEM-04) checks pending obligations in **all** periods; the interest share of a period is divided among the members active **today** (members have no period).

### Data migration (PER-08)
18. One migration creates the table, creates period **2026** and assigns it to every existing loan, activity, transaction and log. Fees are mapped by their current `Year` (a period is created for each distinct fee year; the dev database has QA fees in other years); a fee's transaction and logs get the fee's period. Then `Year` is dropped and the unique index becomes `(UserId, SavingPeriodId, Month) WHERE "Status" <> 'Cancelled'`. `Down` restores `Year` from the period.
19. Period **2025** is added only to the dev database, for testing.
20. Production is out of scope for now (the app is in development); before any production deploy, OPS-04 (Neon snapshot) applies.

## Out of scope
Creating periods from the app; closing or locking a period; carrying balances between periods; storing the selection per user in the database; the public demo (spec 014) is not updated; production deployment.

## Business rules
New: PER-01..08, MP-11. Changed: MP-02, MP-04, MP-10, FIN-09, FIN-13 (scoped by PER-06). All `Pending` until built. See `../business-rules.md`.

## Data model changes
| Table | Change |
|---|---|
| `saving_periods` (new) | `Id` uuid PK, `Year` int UNIQUE |
| `monthly_payments` | + `SavingPeriodId` FK; - `Year`; unique index `(UserId, Year, Month)` becomes `(UserId, SavingPeriodId, Month)`, same filter |
| `loans`, `activities`, `transactions`, `logs` | + `SavingPeriodId` FK (indexed) |

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/saving-periods` | Admin, Member | - | `[{ id, year }]` newest first (not period-scoped) |
| * | every period-scoped read/write | as today | header `X-Saving-Id: <id>` (required) | 400 when missing, malformed or unknown |
| POST/PUT | `/api/monthly-payments[/{id}]` | Admin | `year` removed (the period gives it) | `year` kept in responses |

Period-scoped: monthly payments, loans (and their payments/interest), activities (and assignments), transactions, logs, dashboard, member detail. The exact list and the by-id behavior are fixed in the plan.

## UI
Configuración view (form, select "Año", "Guardar"), Settings icon in the navigation, selected year visible in the app shell, notice when the current year has no period, fee form without "Año". UI copy and layout specified by the ux-designer.

## Delivery
One vertical slice (schema + backend + frontend delivered together, validated once), committed per layer with clear conventional commits.

## Acceptance criteria
1. Given the migrated dev DB, when compared with the backup, then row counts, total available money and fee years/amounts are identical.
2. Given the migration applied on a temporary copy, when reverted, then `monthly_payments."Year"` matches the backup.
3. Given a logged-in user with no stored selection, when the app loads, then the current year's period is selected and its year is shown in the app shell.
4. Given a stored period id that no longer exists, when the app loads, then the default applies.
5. Given the current year has no period (e.g. 2027), when the app loads, then the most recent period is selected and a dismissible notice says so.
6. Given an Admin or a Member, when they choose 2025 in Configuración and press "Guardar", then every view shows only 2025 data and the shell shows 2025.
7. Given 2025 has no data, when the dashboard opens, then available money and every figure are 0 (nothing carried over).
8. Given a period-scoped request without `X-Saving-Id`, or with a malformed or unknown id, then the API returns 400 with an English message.
9. Given `GET /api/saving-periods`, login, members CRUD and `/health` without the header, then they succeed.
10. Given 2025 is selected, when the Admin creates a March fee, then it is stored in 2025, and the same member can also have a March fee in 2026 (MP-04).
11. Given the fee form, then there is no "Año" field and only the free months of the selected year are offered.
12. Given 2026 is selected, when a loan is created with start date 2025-12-31, then the API returns 400 (PER-05) and the form prevents it.
13. Given available money 100 in 2026 and 0 in 2025, when a loan of 50 is created in 2025, then it is rejected (FIN-13 per period).
14. Given a loan payment of a 2026 loan, then its transaction and log belong to 2026 and appear only in 2026 lists.
15. Given a member whose only pending fee is in 2025, when the Admin deactivates them with 2026 selected, then it is blocked (MEM-04, PER-07).
16. Given 2026 is selected, when a 2025 record's URL is opened, then the API returns 404 and the page says the record may belong to another period.
17. Given the public demo, then it works as before (the period UI is hidden there).
18. `dotnet test`, `npm test`, `npm run lint` and `npm run build` pass.

## Test plan
- Backend unit tests per rule ID (PER-03..07, MP-04/MP-11, FIN-13 per period), with in-memory fakes.
- Frontend Vitest for the period selection logic (default, fallback, storage).
- Migration: manual on the Docker dev stack (counts, available money and fee years identical before/after; revert checked on a copy).
- Validator: acceptance criteria on the Docker dev stack, Admin and Member, mobile and desktop.

## Open questions
None. Owner decisions 2026-10-21 (plan review):
1. **Strict by-id access:** a record (or child) whose period differs from `X-Saving-Id` is not found (404); detail pages say it may belong to another period.
2. Flow: the backend exposes the periods, the frontend shows them with their year and sends the selected period id as `X-Saving-Id`. Period 2026 has a fixed id in the migration.
3. Yearly period migrations insert only if the year does not exist yet (`ON CONFLICT ("Year") DO NOTHING`).
4. The public demo keeps working; the period UI (nav item, chip, notice) is hidden in `/demo` for now.
5. When the current year has no period yet, the app goes to the most recent period and shows a notice that can be dismissed for the session and disappears once a period is saved.
