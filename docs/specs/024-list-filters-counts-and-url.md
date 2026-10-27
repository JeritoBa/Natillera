# 024 - List filters: counts and URL

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; UX proposal by the ux-designer; owner answers: "remember" = URL only (option A), only the status **buttons** follow the other filters (select option counts stay period totals), buttons with (0) stay enabled; **responsive is a requirement**)
- **Related rules:** UI-14 (new), UI-15 (new); UI-06, MP-09, PER-06. Supersedes the "read once, not written back" behavior of spec 017 (payments) and spec 021 scope 13 (loans).

## Problem / goal
1. In `/loans` the status buttons ("Activos (8)") count all loans of the period and ignore the month, borrower and search filters. `/members` has the same issue with the search.
2. Filters are lost on reload or when coming back with the browser's Back button; the owner wants every filtered page to keep its filters in the URL.

## User stories
- As an Admin, I want the status counts to match what I am filtering.
- As a user, I want my filters to stay after reloading, going back, or sharing the link.

## Scope
### Status counts (UI-14)
1. The status buttons' counts are computed with **all the other filters of the page except the status itself**:
   - `/loans`: search, borrower, month (`countLoansByStatus(filterLoans(loans, search, month, 'all', borrower))`).
   - `/members`: search (Todos / Activos / Inactivos).
   - `/payments` already does it (unchanged).
2. Buttons with (0) stay **enabled** (as in payments).
3. "Mostrando X de Y": Y stays the period total.
4. Counts inside select options (member, month, borrower, type) stay totals of the period (unchanged).

### Filters in the URL (UI-15)
5. Every filtered page writes its filters to the query string with history **replace** (only the changed key), and reads them on load. Defaults are omitted from the URL.

| Page | Filter | Param | Values |
|---|---|---|---|
| `/payments` | Miembro / Mes / Estado (Admin only) | `member` / `month` / `status` | userId / `YYYY-MM` / `pending`, `paid`, `cancelled` (existing) |
| `/loans` | Búsqueda / Deudor / Mes / Estado | `q` / `borrower` / `month` / `status` | text / userId / `YYYY-MM` / `Active`, `Paid`, `Cancelled` (`borrower`, `status` existing) |
| `/activities` | Mes de inicio | `month` | `YYYY-MM` |
| `/transactions` | Tipo / Mes | `type` / `month` | transaction type enum / `YYYY-MM` |
| `/members` | Búsqueda / Estado | `q` / `status` | text / `active`, `inactive` |
| `/logs` | Búsqueda / Entidad / Acción / Desde / Hasta | `q` / `entity` / `action` / `from` / `to` | text / entity enum / action enum / `YYYY-MM-DD` |
| `/dashboard` | Pendientes | `pending` | existing (spec 021), unchanged |

   The existing casing of `status` values is kept (payments lowercase, loans PascalCase) so the dashboard and pending-obligation links keep working.
6. Selects, buttons and dates: the URL is the single source of truth (as `MembersPendingSection`). Free-text search filters immediately from local state and writes `q` to the URL debounced 300 ms (replace).
7. Invalid values or values absent from the data (a month of another period, a member without records, an unknown enum) behave as "Todos" through the existing `effective*` logic; the URL is not rewritten on load, the next interaction cleans it.
8. "Limpiar filtros" removes every filter param of the page.
9. Changing the saving period keeps the URL; invalid values are ignored (PER-06).
10. Shared hook `shared/lib/useUrlFilter.ts` (`useUrlParam(key, parse, default)` and a debounced text variant) and pure `parse*Filter` functions in each feature `model/`.

## Out of scope
- Restoring filters when entering a list from the sidebar or a "← Volver" button (would need storage; owner chose URL only).
- Counts inside select options following the other filters.
- Disabling buttons with (0).

## Business rules
New UI rules: **UI-14** (status counts follow the other filters), **UI-15** (filters in the URL). Data visibility is unchanged (MP-09: a Member's payments list still has no status filter and shows only Paid). See `../business-rules.md`.

## Data model changes
None.

## API
None.

## UI
No visual change besides the counts. Responsive (requirement, 320-1920 px): filter bars keep their current responsive layout; no horizontal page scroll; targets >= 40 px.

## Acceptance criteria
1. Given `/loans` with 8 Active loans, 2 of them starting in March, when the Admin picks Mes = Marzo 2026, then the button reads "Activos (2)" and "Todos" shows the month total; the same with Deudor and with the search.
2. Given `/members`, when the Admin searches "ana", then Todos/Activos/Inactivos count only the matching members.
3. "Limpiar filtros" restores the period counts and leaves the URL without filter params.
4. When the Admin filters `/loans` by Deudor and Mes, then the URL becomes `/loans?borrower=…&month=2026-03`; reloading keeps both; the history does not grow (Back leaves the page).
5. When the Admin types "ana" in Miembros, then the list filters immediately and about 300 ms later the URL has `?q=ana`.
6. Given `?status=xyz` or `?month=2019-01`, then the page shows "Todos" without errors.
7. Each page of the table in Scope 5 writes and reads all its filters (checked one by one, Admin; `/payments` and `/loans` also as Member).
8. The dashboard links (`?pending=`, `/loans?borrower=&status=Active`, `/payments?member=&status=pending`) and the pending-obligation fee links (`?member=&month=&status=pending`) still apply their filters.
9. After changing the saving period, the filters in the URL are kept and invalid ones ignored.
10. At 320, 375, 768, 1024, 1280 and 1920 px no page has horizontal scroll and the filter controls are >= 40 px.
11. `npm test`, `npm run lint` and `npm run build` pass.

## Test plan
- Vitest (`// UI-14`, `// UI-15`): counts helpers for loans and members; `parse*Filter` per page (valid, invalid, missing); the `useUrlFilter` parsing/default logic.
- Validator on Docker: every page in Scope 5 as Admin, `/payments` and `/loans` as Member, reload/Back, period change, widths of criterion 10.

## Open questions
None (answered 2026-10-26).
