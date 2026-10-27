# 022 - Member fee ledger (monthly fees by month)

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; UX proposal by the ux-designer; owner answers: data from the existing payments list (no backend change), no "not applicable" months before the member joined, amber for Pending and neutral dashed for "no fee" (no red), also on the Member dashboard; **responsive is a requirement**)
- **Related rules:** MEM-11 (new); MP-04, MP-09, MP-10, MP-11, MEM-10, DASH-11, PER-06, UI-02

## Problem / goal
The member detail only shows the total of paid fees ("Cuotas pagadas $X"); the Admin cannot see which months a member has paid. A month-by-month ledger makes it obvious at a glance, and the member can see the same on their own dashboard.

## User stories
- As an Admin, I want to see in a member's detail which months of the period they paid, which are pending and which have no fee, so that I know where they stand.
- As an Admin, I want to jump from a month to the payments list filtered by that member and month.
- As a Member, I want to see my own fee ledger on my dashboard.

## Scope
1. A "Cuotas de {año}" card with the 12 months of the **selected saving period** (PER-06):
   - in the Admin's member detail (`/members/{id}`), between the savings/pending cards and "Movimientos recientes";
   - in the Member dashboard (`/dashboard`, Member role), below "Mis ahorros" and above "Top 10 de ventas".
2. Month states (MEM-11): **Pagada**, **Pendiente**, **Sin cuota**, **Por venir**.
3. Summary line, legend, links (rules below).
4. Shared component `features/monthlyPayments/components/FeeLedger.tsx` and pure model `features/monthlyPayments/model/feeLedger.ts` used by both pages.

## Out of scope
- Backend changes (the data comes from existing endpoints).
- "Not applicable" months before the member joined (the member `createdAt` is the record creation date, not the join date; fees are loaded backwards).
- Registering a fee from a "Sin cuota" month; editing from the ledger.

## Business rules
New: **MEM-11** (fee state per month). Used: MP-04/MP-11 (at most one live fee per member/month, in the period), MP-09 (list visibility), MEM-10/DASH-11 (Pending fees are owed), PER-06, UI-02. See `../business-rules.md`.

## Data model changes
None.

## API
No new endpoint and no contract change.

| Page | Source |
|---|---|
| Admin member detail | `GET /api/monthly-payments` (Admin sees every status, MP-09), filtered client-side by `userId === member.id`; requested in parallel with the member detail. |
| Member dashboard | Paid months: `GET /api/monthly-payments` (a Member receives only `Paid` fees, MP-09) filtered by the member's own `userId`. Pending months: `summary.pendingObligations.monthlyPayments.items` (year, month, amount) of the dashboard response (DASH-11). |

Both requests carry `X-Saving-Id` (PER-04). The public demo already resolves both endpoints.

## UI

All copy in Spanish exactly as written. Figures with `formatCurrency` (COP, no decimals, JetBrains Mono).

### States (MEM-11)
| State | Condition | Look | Screen reader text |
|---|---|---|---|
| Pagada | A `Paid` fee exists for the month | background `#dcf5e8`, solid border `#b8e2c8`, `Icon.Check` `#0a6635` | "{Mes} {año}: pagada, {monto}, el {fecha de pago}" |
| Pendiente | A `Pending` fee exists | background `#fef6dc`, solid border `#f3dc9a`, `Icon.Clock` (new) `#9a6e00` | "{Mes} {año}: pendiente, {monto}" |
| Sin cuota | No live fee and the month has started (all 12 months of a past period) | white background, **dashed** border `#c9d9cf`, "—" `#4e7460` | "{Mes} {año}: sin cuota registrada" |
| Por venir | Month after the current month in the current period; all 12 months of a future period | background `#f8fbf8`, no border, month text `#4e7460`, no glyph | "{Mes} {año}: por venir" |

- No red anywhere (red means "Anulado"/"Egreso" in the app; a month without fee is not a debt, MEM-10).
- State never relies on color alone: glyph, border style, legend and sr-only text.
- The current month has a 2 px green underline (`#0c5c38`) and `aria-current="date"`.

### Card
- `section aria-labelledby`, card style (`rounded-xl p-5`, white, border `#d6e8dc`).
- `h2` "Cuotas de {año}".
- Summary `p text-xs #4e7460`: "{P} de {T} meses pagados · {n} pendiente(s) · {m} sin cuota" (parts with 0 are omitted except the first). T is always 12 (all the months of the period, owner decision 2026-10-26); the summary line and the empty line are both shown when the period has no fees. Future period: "El periodo {año} aún no empieza". Member dashboard uses the same text.
- `ol aria-label="Cuotas de {año} por mes"` with 12 `li`. Chip content: month abbreviation ("Ene"… "Dic", Outfit 12 px semibold, `aria-hidden`), 16 px glyph and, from `sm`, the amount (mono 11 px, `truncate`); full text in `sr-only`; `title` with the full text on linked chips.
- Legend (inline `ul`, `text-xs`): "✓ Pagada · ◷ Pendiente · — Sin cuota · Por venir" with the same glyphs/borders.

### Links
| Page | Pagada | Pendiente | Sin cuota / Por venir |
|---|---|---|---|
| Admin member detail | link to `/payments?member={id}&month={YYYY-MM}` | same link | not focusable (`div`) |
| Member dashboard | link to `/payments?member={own id}&month={YYYY-MM}` | not a link (Members do not see Pending fees in the list, MP-09) | not focusable |

Linked chips: focus visible `focus-visible:outline-2 outline-[#0c5c38]`, `min-h` as below.

### States of the card
- Loading: 12 grey chips `bg-[#eef4f0]` and `p role="status" sr-only` "Cargando cuotas…".
- Error (fee request fails): the rest of the page stays visible; the card shows the standard alert with the friendly error and a "Reintentar" button (`btn-ghost min-h-10`).
- Empty period: chips "Sin cuota"/"Por venir" and the line "Aún no tiene cuotas registradas en {año}." (Member dashboard: "Aún no tienes cuotas registradas en {año}.").
- Inactive member: shown the same (read-only).

### Responsive (requirement, 320-1920 px)
| Width | Grid | Chip height | Amount |
|---|---|---|---|
| < 640 px | `grid-cols-4 gap-2` (3 rows = quarters) | `min-h-14` (56 px) | hidden |
| 640-1279 px | `sm:grid-cols-6` (2 rows = semesters) | `min-h-[72px]` | shown |
| >= 1280 px | `xl:grid-cols-12 gap-1.5` (1 row) | 72 px | shown, `truncate` |

No horizontal page scroll; every chip >= 40 x 40 px (about 56 px wide at 320 px); legend wraps.

## Acceptance criteria
1. Given the Admin on `/members/{id}`, period 2026, today in October 2026, with Paid fees in Jan-Mar, Pending in Oct and only a Cancelled fee in Apr, then Jan-Mar are "Pagada" with ✓, Apr is "Sin cuota", Oct is "Pendiente", Nov-Dec "Por venir", the other started months "Sin cuota", and the summary reads "3 de 12 meses pagados · 1 pendiente · 6 sin cuota".
2. When the Admin activates the March chip, then `/payments?member={id}&month=2026-03` opens with both filters applied.
3. Given the period 2025, then all 12 months have a state and none is "Por venir"; given a future period, all 12 are "Por venir" and the summary reads "El periodo {año} aún no empieza".
4. Given the fee request fails, then the rest of the member detail is shown and the card shows the error with "Reintentar".
5. Given a Member on `/dashboard`, then they see their own ledger: Paid months linked to the payments list, Pending months (from their pending obligations) not linked, and no other member's data.
6. Given widths 320, 375, 768, 1024, 1280 and 1920 px, then the grid has 4, 4, 6, 6, 12 and 12 columns, no horizontal page scroll, chips >= 40 px, and a screen reader announces each month with its state and amount.
7. Given the public demo (Admin member detail and Member dashboard), then the ledger is consistent with the fixtures and no request is sent.
8. `npm test`, `npm run lint` and `npm run build` pass (`dotnet test` unaffected).

## Test plan
- Vitest for `feeLedger.ts` (`// MEM-11`): state per month (Paid wins over Pending if both, cancelled ignored), started months for current/past/future periods, summary text and plurals, link paths per role, merge of Paid list + Pending items for the Member.
- Validator on Docker with "QA ..." data: Admin and Member, all widths of criterion 6, period change.

## Open questions
None (answered 2026-10-26).
