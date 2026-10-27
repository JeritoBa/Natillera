# 021 - Admin dashboard: money by source and pending obligations per member

- **Status:** Implemented (2026-10-25)
- **Owner decision date / reference:** 2026-10-25 (branch `v1.1.1`; UX proposal by the ux-designer; owner answers: show only the three registered sources, no reconciliation row and nothing Pending (revised 2026-10-25), activity earnings = the activity's own **net profit** (ACT-11), rename the card to "Dinero total de la natillera", include loan principal, section title "Pendientes por cobrar"; extras accepted: proportion bar, amounts link to filtered lists, filter kept in the URL; **responsive is a requirement**)
- **Related rules:** DASH-13, DASH-14 (new); DASH-03 (changed); DASH-02, DASH-12, MEM-10, ACT-11, ACT-15, FIN-09, FIN-14, PER-06, DEMO-06, UI-02, UI-06

> **This feature changes the Admin's "Ganancias de actividades" figure:** it becomes the sum of the activities' **net profit** (collected - total cost, ACT-11), the same number shown as "Ganancia neta" in each activity detail. Extra costs are not part of it (ACT-15); they are already deducted in "Rendimientos de préstamos" (DASH-12).

## Problem / goal
The Admin sees the total money of the natillera but not where it comes from: the paid monthly fees are not shown at all, and to know who owes what the Admin must open every member detail. This spec adds a breakdown of the total money by source and a single table of everything each member still owes, filterable by kind.

## User stories
- As an Admin, I want to see how much of the natillera's money comes from monthly fees, from activities and from loan interest, so that I understand the result of the period.
- As an Admin, I want to see which member owes the most, so that I know whom to collect from first.
- As an Admin, I want to separate the pending amounts by kind (fees, loan principal, interest, activity sales), so that I can collect one kind at a time.
- As an Admin, I want to jump from an amount to the list that explains it.

## Scope

### 1. Money by source (DASH-13)
1. The Admin dashboard card "Rendimiento de la natillera" is renamed **"Dinero total de la natillera"**; its headline stays `totalNatilleraBalance` (DASH-02).
2. Below the headline, a breakdown "De dónde viene" with these rows, in this order:
   | Row | Figure | Definition |
   |---|---|---|
   | Cuotas pagadas | `paidMonthlyPayments` (new) | SUM(amount) of `Paid` monthly payments of the period |
   | Ganancias de actividades | `activityEarnings` (**changed**, DASH-03) | SUM over non-cancelled activities of the period of net profit = collected - total cost (ACT-11). May be negative. |
   | Rendimientos de préstamos | `sharedInterestPool` (unchanged, DASH-12) | Paid interest - paid extra costs |
3. **Only registered money counts.** The three rows come only from movements already recorded as non-cancelled Income/Expense transactions of the period (FIN-09). **Pending records never count** (Pending fees, Pending interest, Pending assignments, Pending extra costs), because they have not entered or left the fund yet (FIN-08). There is **no** extra reconciliation row: the three rows are not required to add up to the headline, which also includes the cost of Pending assignments (DASH-02).
4. **Proportion bar:** a horizontal stacked bar under the breakdown shows the share of each row with a **positive** value. A row with value <= 0 has no segment and is still listed with its amount (a negative value shown only with "-", UI-02). When no row is positive, the bar is not shown.

### 2. Pending obligations per member (DASH-14)
5. New Admin-only section **"Pendientes por cobrar"**, placed between "Top 10 de ventas" and "Movimientos recientes".
6. One row per member with total pending > 0 in the selected period: MEM-10 applied to each member (fees, loan principal, interest, activity sales), using the **same calculator** as the member detail, so each row total equals the member detail "Debe $ X". Inactive members with pending items are included.
7. Default order: total descending, then member name A-Z.
8. **Filter by kind:** "Todos", "Cuotas", "Préstamos (capital)", "Intereses", "Ventas de actividades". With a kind selected, only members with an amount > 0 in that kind are shown, ordered by that amount descending, then name. Each filter shows the number of members it would show; filters with 0 are disabled.
9. **Filter in the URL:** the selected kind is written to the query string (`/dashboard?pending=monthlyPayments|loans|interests|activitySales`, absent = "Todos") with history replace, and read on load. An unknown value means "Todos". Changing the saving period keeps the filter.
10. **Totals row** "Total por cobrar": the sum of the visible rows per column.
11. **Amounts link to the list that explains them** (see "Links" in UI).

### 3. Loans list filter by borrower (needed by the links)
12. The loans list gets a **"Deudor"** select filter (all members that have a loan in the period, "Todos los deudores" by default), combined with the existing filters and cleared by "Limpiar filtros".
13. The loans list reads `?borrower={userId}&status=Active` once on load (as the payments list already does with `member`/`status`, spec 017); the URL is not written back.

## Out of scope
- Retry button on the dashboard error, sorting by clicking column headers, exporting the table (CSV/WhatsApp), clarifying the "al costo" label of the green block: proposed, not requested.
- List pages for loan interest or activity assignments (they do not exist; those amounts link to the member detail, see UI).
- Any change to the Member dashboard, to the member detail, or to how MEM-10, DASH-04, DASH-06 or DASH-12 are computed.
- Writing filters back to the URL in other list pages.

## Business rules
New: **DASH-13** (money by source, registered movements only), **DASH-14** (pending obligations per member for the Admin). Changed: **DASH-03** (the Admin's activity earnings become the sum of the activities' net profit, ACT-11). Used: DASH-02, DASH-12, MEM-10, ACT-11, ACT-15, FIN-09, FIN-14, PER-06, DEMO-06, UI-02, UI-06. See `../business-rules.md`.

## Data model changes
None. Everything is derived on read (FIN-09); no migration.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/dashboard/summary` | Admin, Member | `X-Saving-Id` (PER-04) | Admin: + `paidMonthlyPayments` (decimal), + `membersPendingObligations` (list, below); `activityEarnings` now = SUM of the activities' net profit (DASH-03). Member: the new fields are `null`; nothing else changes. |
| GET | `/api/loans` | Admin, Member | unchanged | unchanged (the borrower filter is client-side; the list already carries `borrowerId`) |

`membersPendingObligations` item (Admin only, total > 0, ordered total desc then name):

```
{
  userId, memberName, isActive, total,
  monthlyPayments: { count, amount },
  loans:           { count, amount },
  interests:       { count, amount },
  activitySales:   { count, amount }
}
```

Built with one set of period-filtered queries for all members (no N+1) and `PendingObligationsCalculator` per member, so the definition of MEM-10 stays single. Errors use the app format `{ "message": "..." }` (OPS-05).

## UI

Route `/dashboard`, Admin only for the changes below; the Member dashboard does not change. All copy in Spanish exactly as written. Figures: COP without decimals (`formatCurrency`), JetBrains Mono (`mono`), negatives only with "-" (UI-02), no red.

### Card "Dinero total de la natillera"
- Same position and size as today (right of the green "Dinero disponible" block, `lg:col-span-2`; the green block does not change).
- `h2` "Dinero total de la natillera" (the old `<p>` with the same text is removed); headline figure as today; caption "Disponible + prestado + actividades".
- Subheading `h3` "De dónde viene" (small uppercase, `#4e7460`), then a `<dl>` (reuse `rowClass`), each `dt` with a secondary line:
  - "Cuotas pagadas" — "Aportes de los miembros"
  - "Ganancias de actividades" — "Ganancia neta de las actividades" (green `#0a6635` when >= 0, `#0c1a12` with "-" when < 0)
  - "Rendimientos de préstamos" — current secondary line ("Intereses pagados $I − costos extra $C" when there are extra costs)
- **Proportion bar** below the `<dl>`: height 8 px, rounded, full width; one segment per positive row, widths proportional to the values, a 2 px white gap between segments. Colors: fees `#0c5c38`, activities `#3f9b6b`, interest `#9a6e00`. Each `dt` gets a 10 px colour dot matching its segment (a row without segment gets no dot). The bar is `role="img"` with `aria-label` "Proporción: cuotas {p}%, actividades {p}%, rendimientos {p}%" (positive rows only, integer percentages). Not shown while loading or when no row is positive.
- States: loading shows "—" in the headline and hides the breakdown and bar (as today); zero values show "$ 0", they are not hidden (except the conditional row).

### Section "Pendientes por cobrar"
- `section` with `aria-labelledby`, `aria-busy` while loading; card style as the ranking. Header: `h2` "Pendientes por cobrar", `p` "Lo que cada miembro le debe a la natillera en este periodo".
- **Filters:** `role="group" aria-label="Filtrar por tipo de pendiente"`, single-choice buttons with `aria-pressed`, same style as the loans status filter: "Todos ({n})", "Cuotas ({n})", "Préstamos (capital) ({n})", "Intereses ({n})", "Ventas de actividades ({n})"; `n` = members shown by that filter; `disabled` when 0. Labels come from one exported map in `pendingObligations.ts` (no duplicated strings). Below: `p aria-live="polite"` "Mostrando {x} de {y} miembros con pendientes".
- **Table** (`tableScroll`, shared `tableStyles`), `caption` (sr-only) "Pendientes por cobrar por miembro, ordenados de mayor a menor":
  - Columns: "Miembro" | "Cuotas" | "Préstamos (capital)" | "Intereses" | "Ventas de actividades" | "Total". The column that orders the rows has `aria-sort="descending"`; with a kind selected that column is also highlighted (`font-semibold`, background `#f8fbf8`).
  - Member cell: link to `/members/{userId}` (`mainLink`), `aria-label` "Ver detalle de {nombre}, debe {monto principal}"; "Inactivo" badge in the secondary line for inactive members.
  - Zero cells: "—" (`aria-hidden`) + sr-only "Sin pendientes".
  - Footer row "Total por cobrar" with the sum of the visible rows per visible column.
  - All rows shown (small group); no pagination.
- **Links** (every non-zero amount cell is a link; `aria-label` "Ver {tipo} pendientes de {nombre}"):
  | Amount | Goes to |
  |---|---|
  | Cuotas | `/payments?member={userId}&status=pending` (existing filters, spec 017) |
  | Préstamos (capital) | `/loans?borrower={userId}&status=Active` (new borrower filter, scope 3) |
  | Intereses | `/members/{userId}#pendientes` (member detail, pending obligations section, which already lists each interest with its link) |
  | Ventas de actividades | `/members/{userId}#pendientes` (same, lists each assignment with its link) |
  | Total | `/members/{userId}#pendientes` |
  The member detail pending section gets `id="pendientes"` and the page scrolls to it when the hash is present after loading.
- **States:** loading `p role="status"` "Cargando pendientes..."; empty (nobody owes): check icon in a `#dcf5e8` circle, "Todos están al día", "Nadie tiene pagos pendientes en este periodo." and no filters; error: the dashboard page error already covers it (same request).

### Responsive (requirement, all widths from 320 px to 1920 px)
No horizontal page scroll at any width; only the table container may scroll horizontally, and only as a last resort. Touch targets >= 40 px. Verified at **320, 375, 414, 768, 1024, 1280 and 1920 px**.

| Width | Cards (green block + "Dinero total") | Proportion bar / breakdown | "Pendientes por cobrar" table | Filters |
|---|---|---|---|---|
| < 640 px (phones) | Stacked, full width | Full width; labels may wrap to two lines, amounts `whitespace-nowrap` right-aligned | Two columns: "Miembro" (with a secondary line) + main amount (total, or the selected kind). Secondary line: in "Todos", non-zero kinds as counts joined by " · " ("2 cuotas · 1 interés"; plurals "cuota/cuotas", "préstamo/préstamos", "interés/intereses", "venta/ventas"); with a kind, "{conteo} · Total {total}". In the secondary line, the counts are not links; the member link and the main amount link are. Footer: "Total por cobrar" + main column sum. | Wrap to several lines (`flex-wrap`), each button full text |
| 640-1023 px (large phones, tablets portrait) | Stacked, full width | As above | Same two columns as phones (secondary line `subTablet`) | Wrap |
| 1024-1279 px (tablets landscape, small laptops) | Side by side (3 + 2 columns, as today) | Inside the right card | Same two columns plus the secondary line | One or two lines |
| >= 1280 px (desktop) | Side by side | Inside the right card | All six columns (`colDesktop`), secondary line hidden | One line |

- Long member names wrap (`break-words`), never truncate the amount.
- Text zoom to 200% must not overlap content; layout uses relative units and `flex-wrap`.
- The bar keeps its height and is always full width of its card; the legend is the `<dl>` itself (no separate legend that could overflow).

### Public demo (DEMO-06)
The demo fixtures add `paidMonthlyPayments` and `membersPendingObligations`, and recompute `activityEarnings` as the activities' net profit, consistent with the fixture transactions (DEMO-06). Links work inside the demo like the other links.

## Acceptance criteria
1. Given an Admin in period P with Paid fees F, activities with net profits N1..Nk (non-cancelled), and net pool R, when they open `/dashboard`, then the breakdown shows exactly three rows: "Cuotas pagadas" = F, "Ganancias de actividades" = N1+..+Nk and "Rendimientos de préstamos" = R. Pending, cancelled and other-period records do not count; creating a Pending fee, interest or assignment changes none of the three.
2. Given an activity whose collected amount is below its total cost, then its negative net profit lowers "Ganancias de actividades", shown with "-" and without a bar segment when the sum is <= 0.
3. Given "Ganancias de actividades" in the dashboard, then it equals the sum of the "Ganancia neta" headlines of the non-cancelled activities of the period, and adding a Paid extra cost does not change it (ACT-15) but lowers "Rendimientos de préstamos".
4. Given positive rows, then the proportion bar shows one segment per positive row with widths proportional to the values and an accessible label with the percentages.
5. Given members with pending obligations, then "Pendientes por cobrar" appears below "Top 10 de ventas", ordered by total descending then name, each total equal to the member detail "Debe $ X", and the footer is the sum of the rows.
6. When the Admin presses "Intereses", then only members with Pending interest are listed, ordered by that amount, the counter reads "Mostrando x de y miembros con pendientes", the URL becomes `/dashboard?pending=interests`, and reloading the page keeps the filter; filters with (0) are disabled; `?pending=xyz` shows "Todos".
7. Given a member row, when the Admin clicks the fees amount, then the payments list opens filtered by that member and Pending; the loan principal amount opens the loans list filtered by that borrower and "Activos"; the interest, activity sales and total amounts open the member detail scrolled to its pending obligations section.
8. Given the loans list, then the "Deudor" filter combines with the month, search and status filters and "Limpiar filtros" resets it.
9. Given nobody owes anything, then "Todos están al día" is shown without filters.
10. Given a Member, then their dashboard is unchanged and the response has `paidMonthlyPayments: null` and `membersPendingObligations: null`.
11. Given widths 320, 375, 414, 768, 1024, 1280 and 1920 px, then there is no horizontal page scroll, every figure is readable, the table shows the columns in the responsive table above, buttons and links are >= 40 px, and keyboard focus is visible on filters and links.
12. Given another saving period selected, then every figure and row changes to that period and nothing carries over (PER-06).
13. Given the public demo as Admin, then the new sections show figures consistent with the fixtures (DEMO-06) and no request is sent.
14. `dotnet test`, `npm test`, `npm run lint` and `npm run build` pass.

## Test plan
- Backend (xUnit, fakes): `DashboardServiceTests` for `membersPendingObligations` (only total > 0, order, Member gets null, same totals as `PendingObligationsCalculator`) — `// DASH-14`; Admin summary fields (`paidMonthlyPayments`, net activity earnings) where the fakes allow — `// DASH-13`, `// DASH-03`. The repository queries are covered by the validator on Docker (integration tests pending).
- Frontend (Vitest, pure model): `features/dashboard/model/pendingByMember.ts` (filter and order per kind, counts per filter, column totals, plural count line, URL param parsing) and `features/dashboard/model/sourceBreakdown.ts` (the three rows, positive-only segments and percentages) — rule IDs in test names; `demoFixtures.test.ts` checks the three figures against the fixture transactions; loans borrower filter in the loans filter helper.
- Validator on the Docker stack with "QA ..." data: Admin and Member, all widths of acceptance criterion 11, period change, figures cross-checked against `/transactions`, the activity details and two member details.

## Open questions
None. (Answered by the owner on 2026-10-25; the link targets for interest and activity sales — member detail, because no list page exists — are part of this draft for approval.)
