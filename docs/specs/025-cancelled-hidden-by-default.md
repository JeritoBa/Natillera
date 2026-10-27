# 025 - Cancelled (and inactive) records hidden by default

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; planner analysis; owner answers: cancelled records only appear with the "Anulados" filter; detail child tables hide them behind a "Ver anulados (n)" toggle (option B); **members: the default view shows only active members, inactive members appear only with the "Inactivos" filter (same logic)**; select option counts stop counting cancelled records; activity labels "Todas / Pendientes / Cerradas / Anuladas"; Members (role) can also pick "Anulados"; **responsive is a requirement**)
- **Related rules:** UI-16 (new); UI-01, TX-01, UI-14, UI-15 (changed); TX-03 (spec 026), MP-09, MP-10, ACT-06, FIN-10

## Problem / goal
Cancelled records mix with live ones in every list, which makes the lists noisy. The default view must show only live records; cancelled ones stay available behind an explicit filter. Members follow the same logic with inactive members.

## User stories
- As a user, I want lists to show only live records by default and to see cancelled ones only when I ask for them.
- As an Admin, I want the members list to show active members by default and inactive ones only when I filter them.

## Scope
### Lists (UI-16)
| List | Default view | Filter buttons | URL `status` values |
|---|---|---|---|
| `/payments` (Admin) | Pending + Paid | Todas · Pendientes · Pagadas · Anuladas (as today; "Todas" excludes cancelled) | `pending`, `paid`, `cancelled` (existing) |
| `/payments` (Member) | Paid only (MP-09, unchanged) | none | — |
| `/loans` | Active + Paid | Todos · Activos · Pagados · Anulados ("Todos" excludes cancelled) | `Active`, `Paid`, `Cancelled` (existing) |
| `/activities` | Pending + Finished | **new** Todas · Pendientes · Cerradas · Anuladas | `Pending`, `Finished`, `Cancelled` (new) |
| `/transactions` | non-cancelled | **new** Todos · Anulados (server-side, TX-03 `status` param, counts in the response) | `cancelled` (new) |
| `/members` | **active only** | Activos · Inactivos (the "Todos" button is removed; the default "Activos" is omitted from the URL) | `inactive` (existing value; `active` no longer needed) |
| `/logs` | unchanged (logs are immutable, FIN-10; cancellations are the "Anulación" action) | — | — |

- Status button counts follow UI-14 (other filters except the status). "Todos/Todas (n)" counts the non-cancelled records left by the other filters.
- **Select option counts** (month, member, borrower, type) no longer count cancelled records (nor inactive members where they apply).
- "Mostrando X de Y": Y = records of the period with the chosen status, without the other filters (paginated lists use UI-17).
- Hiding is a **view only**: balances, guards and form helpers keep using every record (e.g. MP-10 month availability, ACT-06 selectable members, summaries in detail pages, dashboard figures).
- Members (role) can also pick "Anulados" in transactions, loans and activities (transparency, TX-01).
- Dashboard and member detail lists already exclude cancelled records: unchanged.

### Detail child tables
- Loan detail (loan payments, interest) and activity detail (assignments, extra costs) hide cancelled rows by default; a button "Ver anulados (n)" / "Ocultar anulados" (local state, not in the URL, `aria-expanded`, `min-h-10`) shows them at the end, as today. The button is hidden when n = 0.

### Transactions API (with spec 026)
- `GET /api/transactions` adds `status` (`active` default, `cancelled`; else 400 "Unknown status.") and `statusCounts: { active, cancelled }` computed with type and month but not status. `summary` keeps excluding cancelled transactions.

## Out of scope
Changing the audit log; hiding cancelled records on the dashboard (already excluded); persisting the detail toggle.

## Business rules
New: **UI-16**. Changed: **UI-01** (a cancelled item keeps its badge wherever it is shown, but lists hide cancelled items by default), **TX-01** (cancelled transactions are listed only with `status=cancelled`), **UI-14** (activities and transactions status buttons; members buttons Activos/Inactivos), **UI-15** (new `status` params). See `../business-rules.md`.

## Data model changes
None.

## API
| Verb | Route | Role | Change |
|---|---|---|---|
| GET | `/api/transactions` | Admin, Member | + `status` query (`active`/`cancelled`), + `statusCounts` in the response (spec 026 contract) |

Other lists filter on the client (not paginated).

## UI
As in Scope. Spanish copy exactly as listed. Responsive 320-1920 px: filter buttons wrap, targets >= 40 px, no horizontal page scroll; the detail toggle fits at 320 px.

## Acceptance criteria
1. Given 10 loans (1 Cancelled), when opening `/loans`, then "Todos (9)" lists 9 and "Anulados (1)" lists only the cancelled one; the same for payments (Admin), activities and transactions.
2. Given `/transactions?status=cancelled`, then only cancelled transactions are listed and the income/expense cards are 0.
3. Given `/activities`, then the new buttons Todas/Pendientes/Cerradas/Anuladas filter, follow the month filter in their counts and are kept in the URL.
4. Given `/members`, then only active members are listed by default; "Inactivos (n)" lists the inactive ones; the search applies to both.
5. Given the month/member/borrower/type selects, then their counts do not include cancelled records.
6. Given a loan detail with a cancelled payment, then it is hidden and "Ver anulados (1)" shows it at the end; the same for interest, assignments and extra costs.
7. The dashboard links (`/loans?status=Active`, `/payments?...&status=pending`, `?pending=`) still work; MP-10 still offers the months of cancelled fees; ACT-06 member selection is unchanged.
8. A Member can pick "Anulados" in transactions, loans and activities.
9. At 320, 375, 768, 1024, 1280 and 1920 px no page scrolls horizontally and controls are >= 40 px.
10. `dotnet test`, `npm test`, `npm run lint`, `npm run build` pass.

## Test plan
- Vitest (`// UI-16`): `all` semantics and counts in payment, loan, activity, member and transaction filter helpers; option counts without cancelled; demo paging with `status`.
- Backend (`// UI-16`, `// TX-03`): `status` validation and `statusCounts` in the transactions query.
- Validator on Docker: every list and detail table, Admin and Member, widths of criterion 9.

## Open questions
None.
