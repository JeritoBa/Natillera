# 018 - Saving periods

- **Status:** Approved (2026-10-21)
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

## Acceptance criteria
Defined in the implementation plan and added here before build.

## Test plan
- Backend unit tests per rule ID (PER-03..07, MP-04/MP-11, FIN-13 per period), with in-memory fakes.
- Frontend Vitest for the period selection logic (default, fallback, storage).
- Migration: manual on the Docker dev stack (counts, available money and fee years identical before/after; revert checked on a copy).
- Validator: acceptance criteria on the Docker dev stack, Admin and Member, mobile and desktop.

## Open questions
1. Opening a record by id from another period (e.g. a 2025 loan while 2026 is selected): allowed using the record's own period, or 404? To decide with the plan.
