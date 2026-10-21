# 017 - Pending obligations redesign, list filters and responsive tables

- **Status:** Approved (2026-10-21)
- **Owner decision date / reference:** 2026-10-21 (ux-designer spec reviewed by the owner; one commit per task)
- **Related rules:** MEM-10, DASH-11 (presentation only), MP-09, UI-01, UI-02, UI-06, TX-01, FIN-06

## Problem / goal
The pending obligations card (member detail and member dashboard) is saturated and hard to read; the monthly payments list has no filters; the transactions filters differ from the other lists and have no month filter; on mobile most tables distort and some stat cards look off-centre. Also, the transactions totals include cancelled transactions.

## User stories
- As an Admin or Member, I want to understand at a glance what a member owes and jump to each record, so that I can follow up.
- As an Admin, I want to filter monthly payments by member, month and status, so that I find a fee quickly.
- As a user, I want the transactions filters to look like the other lists and to filter by month.
- As a user on a phone, tablet or PC, I want every list and figure to be readable.

## Scope

### Task 1 - Pending obligations card
Redesign only the shared `features/members/components/PendingObligationsCard.tsx` (Admin member detail and Member dashboard).
1. Headline: "Debe $ X" (Admin) / "Debes $ X" (Member), current amber style; below it "Suma de {n} pagos pendientes" ("Suma de 1 pago pendiente" when n = 1), n = sum of the group counts.
2. The separate per-kind breakdown list is removed. One group per kind (order and labels from `pendingKinds`, empty kinds hidden): header "{Label} ({count})" with the subtotal on the right, then the items.
3. Each item row is the whole link (min height 44 px, hover background, visible focus, "›" at the end, `aria-label` "Ver {concepto}, debe {monto}"). Rows without a link use the same layout without "›".
4. Item copy: fee "{Mes} {año}"; loan "Préstamo del {dd/mm/aaaa}" + second line "Prestado {$}"; interest: keep the current concept and link (it opens the interest under its loan, `/loans/:loanId/interest-payments/:id`; owner: it already shows which loan it belongs to); sale "{activityName}" + second line "{q} unidades × {$}".
5. At most 3 items per group; more shows "Ver todos ({n})" / "Ver menos" (`aria-expanded`).
6. Links: Admin fee items go to `/payments?member={memberId}&month=YYYY-MM&status=pending` (Task 2); Member fee items have no link (MP-09); loans, interest and assignments link to their detail pages for both roles.
7. States unchanged: Admin "Está al día / No tiene pagos pendientes."; Member sees nothing when nothing is pending.
8. Layout: member detail cards at equal width (`lg:grid-cols-2`); the dashboard section drops `role="status"`.

### Task 2 - Monthly payments filters
9. Filter card like the Loans one: select "Miembro" ("Todos los miembros" + members found in the payments, A-Z, with counts); select "Mes de la cuota" ("Todos los meses" + months found, newest first, with counts; month = the fee's own year/month, `YYYY-MM`); Admin only: status buttons "Todas / Pendientes / Pagadas / Anuladas" with counts (Members only get Paid fees, MP-09).
10. "Mostrando X de Y cuotas" (`aria-live`), "Limpiar filtros" when a filter is set; no matches: "No hay cuotas que coincidan con los filtros."
11. The page reads `?member=&month=&status=` once as initial filters (not written back).
12. Stat cards follow the active filters and say "(filtro)" when a filter is set; "Pagaron" becomes "Cuotas pagadas" and "Cuotas reales" becomes "Cuotas vigentes".
13. Subtitle becomes "Aportes de cada miembro" (removes the hard-coded month).

### Task 3 - Transactions filters
14. The type buttons are replaced by the same filter card: select "Tipo" ("Todos los tipos" + type labels) and select "Mes" ("Todos los meses" + months found, newest first, with counts). Month = local (Colombia) date of `occurredAt`, not `slice(0, 7)` of the UTC timestamp.
15. Counter "Mostrando X de Y movimientos", "Limpiar filtros", no matches "No hay movimientos que coincidan con los filtros."; stat cards follow the filters ("(filtro)").
16. Loading row has `role="status"`; error state has "Reintentar".

### Fix - Cancelled transactions (separate commit)
17. The frontend type keeps `isCancelled`; cancelled transactions are excluded from "Ingresos totales" / "Egresos totales" (FIN-06) and shown with the "Anulado" badge and a struck-through grey amount (TX-01).
18. The `cancelled` badge label is "Anulado" (UI-01).

### Task 4 - Responsive consistency
19. One table pattern, with shared class strings in `shared/ui/tableStyles.ts` (reference: `LoansPage.tsx`):
    - Mobile (< 640 px): main cell (link, truncated) + amount + edit/cancel actions; a small line below the main cell with date, badge and one context field; no eye button.
    - Tablet/laptop (640-1279 px): adds the status column, at most one key secondary column and the eye button; other secondary data in the line below.
    - Desktop (>= 1280 px): all columns.
    - Cell padding `px-3 sm:px-4`; icon buttons at least 40 x 40 px at every width; tables wrapped in a horizontal-scroll container.
20. Applied to: activities list and detail, members, monthly payments, transactions, logs, loan detail, dashboard recent movements (description links to the transaction detail), loans (shared classes).
21. Page padding `p-4 sm:p-6 lg:p-8`.
22. New `shared/ui/StatCard.tsx`: centred label and value, uniform height; used on members, monthly payments and transactions.
23. Dashboard: a negative available balance is shown with the "-" sign only, no red background (UI-02).

## Out of scope
Backend changes; searching transactions by member; a hide-cancelled toggle; persisting filters in the URL beyond the initial read; showing values on mobile in the logs list; a monthly payment detail page; removing legacy files.

## Business rules
No new rules. "Enforced in" of UI-01, UI-02, UI-06 and TX-01 updated where the code moves.

## Data model changes
None.

## API
None (the frontend already receives `isCancelled`).

## UI
See Scope. Brand rules apply (JetBrains Mono for amounts, COP without decimals, Spanish copy).

## Acceptance criteria
1. Given a member with 1 Pending fee, 1 loan with outstanding principal, 1 Pending interest and 1 Pending assignment, When the Admin opens the member detail, Then the card shows the total, "Suma de 4 pagos pendientes" and 4 groups, each kind once; every item row (>= 44 px) opens its record; the fee opens `/payments` filtered by that member, month and Pending. The Member dashboard shows the same, with no link on fees.
2. Given `/payments?member=X&month=2026-10&status=pending`, Then the list opens filtered; a Member sees no status buttons.
3. Given the Payments and Transactions filters, Then they combine, the counter, "Limpiar filtros" and the "(filtro)" stat cards work; a transaction at 23:00 on 31/10 Colombia time is listed under October.
4. Given a cancelled transaction, Then it shows "Anulado", its amount is struck through and it is excluded from both totals.
5. At 375, 768 and 1280 px: no horizontal page scroll on any list; amount and actions always visible; stat values aligned and centred; a negative balance has no red background.
6. `npm test`, `npm run lint` and `npm run build` pass, with new model tests (payment filters, transaction filters, pending wording).

## Test plan
- Vitest: `paymentFilters.ts`, `transactionFilters.ts` (local month key), pending obligations wording/labels, transaction totals excluding cancelled.
- Manual on the Docker stack (Admin and Member) at 375, 768, 1024 and 1280 px: `/members/:id`, `/dashboard`, `/payments`, `/transactions`, `/members`, `/loans`, `/activities`, `/activities/:id`, `/loans/:id`, `/logs`. Test data names start with "QA".

## Open questions
None. Owner decisions 2026-10-21: status filter with four options; stat cards follow filters with "(filtro)" and the renamed labels; member filter is a select; the cancelled-transactions fix is a separate commit; the dashboard link and the red background are fixed; the interest item keeps its current loan link (no backend change).
