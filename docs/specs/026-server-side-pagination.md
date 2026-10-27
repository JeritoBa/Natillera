# 026 - Server-side pagination for transactions and the audit log

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; planner analysis; owner answers: fixed page size 50, API maximum 100, no selector; audit search by user name, id and exact amount without accent-insensitivity for now (`unaccent` extension left as a pending item); counter "Mostrando A–B de N" with N = filtered total; an empty valid month shows the empty list with "Limpiar filtros"; composite indexes migration included; **responsive is a requirement**)
- **Related rules:** TX-03, AUD-04, UI-17 (new); TX-01, AUD-01, UI-15, DEMO-02 (changed); PER-04, PER-06, UI-06, OPS-05, OPS-04

## Problem / goal
`GET /api/transactions` and `GET /api/logs` return every record of the period and the browser filters them. As the data grows this overloads the network and the browser. Both lists must be paginated and filtered on the server.

## User stories
- As a user, I want the transactions list to load fast and page through the results.
- As an Admin, I want the same for the audit log.

## Scope
1. **Transactions (TX-03):** `GET /api/transactions` returns one page of the selected period's transactions (PER-06), newest first (`OccurredAt` desc, then `Id` desc), filtered on the server by `type` and `month` (`YYYY-MM`, Colombia date UTC-5, UI-06). Response `{ items, total, page, pageSize, summary: { income, expense }, months: [{ month, count }] }`: `total` = filtered count; `summary` = sums of the filtered non-cancelled transactions (FIN-06); `months` = months of the period with their count (select options). Both roles (TX-01).
2. **Audit log (AUD-04):** `GET /api/logs` (Admin, AUD-01) returns one page of the period's logs, newest first (`OccurredAt` desc, `Id` desc), filtered on the server by `entity`, `action`, `from`/`to` (inclusive Colombia dates `YYYY-MM-DD`) and `q` (case-insensitive match on the user's full name or the entity id, or an exact old/new amount when `q` is a number). Response `{ items, total, page, pageSize }`.
3. **Paging parameters:** `page` >= 1 (default 1), `pageSize` 1-100 (default and UI value **50**). Invalid values -> 400 `{ message }` (OPS-05). A page past the end returns no items with the real `total`.
4. **UI pager (UI-17):** "Mostrando A–B de N movimientos" / "Mostrando A–B de N registros" (N = filtered total) and a pager "Anterior · Página P de T · Siguiente". The page lives in the URL as `page` (UI-15, default 1 omitted); any filter change or "Limpiar filtros" returns to page 1 in the same URL update; a page past the end shows an empty state with "Ir a la primera página". After changing page the view scrolls to the top of the table.
5. **Indexes:** composite indexes `(SavingPeriodId, OccurredAt)` on `transactions` and `logs` (one migration). Neon backup before deploying (OPS-04).
6. **Demo (DEMO-02):** the demo client serves both endpoints with the same paginated contract from its fixtures.
7. Not affected: dashboard recent movements (DASH-08) and member detail movements (their own queries).

## Out of scope
Paginating other lists; page-size selector; infinite scroll; column sorting; accent-insensitive search (pending: `unaccent` extension in a migration, see AGENTS.md section 8).

## Business rules
New: **TX-03**, **AUD-04**, **UI-17**. Changed: **TX-01** and **AUD-01** (paginated), **UI-15** (paginated lists add `page`), **DEMO-02** (same paginated contract). See `../business-rules.md`.

## Data model changes
| Table | Change |
|---|---|
| `transactions` | index `(SavingPeriodId, OccurredAt)` |
| `logs` | index `(SavingPeriodId, OccurredAt)` |

Migration `AddListPagingIndexes`.

## API
| Verb | Route | Role | Query | Response / errors |
|---|---|---|---|---|
| GET | `/api/transactions` | Admin, Member | `page`, `pageSize`, `type`, `month` (+ `X-Saving-Id`) | `{ items, total, page, pageSize, summary: { income, expense }, months: [{ month, count }] }`; 400 "Page must be at least 1.", "Page size must be between 1 and 100.", "Unknown transaction type.", "Month must use the format YYYY-MM." |
| GET | `/api/logs` | Admin | `page`, `pageSize`, `q`, `entity`, `action`, `from`, `to` (+ `X-Saving-Id`) | `{ items, total, page, pageSize }`; 400 paging errors, "Dates must use the format YYYY-MM-DD.", "The 'from' date must be on or before the 'to' date.", "Unknown entity type.", "Unknown action." |

The response shape changes from an array to an object: **the SPA and the API must be deployed together**.

## UI
- `/transactions`: cards Ingresos / Egresos / Movimientos from `summary` and `total`; month select from `months`; counter and pager.
- `/logs`: counter and pager; search hint unchanged.
- Pager: `<nav aria-label="Paginación">`, buttons "Anterior"/"Siguiente" (`min-h-10`, disabled at the ends), "Página P de T"; at 320 px the buttons wrap full width. Loading and error states as today; stale responses are discarded.
- Responsive 320-1920 px, targets >= 40 px, no horizontal page scroll.

## Acceptance criteria
1. Given 120 transactions in the period, when a user opens `/transactions`, then 50 are listed newest first, the counter reads "Mostrando 1–50 de 120 movimientos" and "Página 1 de 3".
2. When the user presses "Siguiente", then the URL has `page=2` and rows 51-100 are listed; reloading keeps page 2.
3. When the user changes the type or the month, then the page returns to 1 and `total`, the cards and the counter reflect the filter (server-side).
4. Given `?page=99`, then the list is empty with "Ir a la primera página"; given `pageSize=101` or `page=0` on the API, then 400 `{ message }`.
5. Given `/logs` with `entity`, `action`, `from`/`to` and `q` (user name, entity id, exact amount), then the server returns the matching page; from > to returns 400.
6. Given a Member, `/api/logs` is still 403 and `/api/transactions` works.
7. Given another saving period, every result belongs to that period only.
8. The public demo pages both lists with the same contract and sends no request.
9. At 320, 375, 768, 1024, 1280 and 1920 px the pager and counters fit without horizontal scroll and buttons are >= 40 px.
10. `dotnet test`, `npm test`, `npm run lint`, `npm run build` pass; the migration applies on the Docker dev stack.

## Test plan
- Backend (`// TX-03`, `// AUD-04`): query validation (defaults, limits 0/1/100/101, unknown enums, malformed month/date, from > to, numeric `q`), Colombia time ranges (March, December to January, one day, a UTC hour that belongs to the previous Colombia month). EF queries validated on Docker (integration tests pending).
- Frontend (`// UI-17`): pagination helpers, `page` reset with filters in one URL update, query builders, demo paging.
- Validator on Docker with enough data (the dev DB has hundreds of transactions; otherwise "QA ..." data).

## Open questions
None.
