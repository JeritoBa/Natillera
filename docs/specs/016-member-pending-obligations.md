# 016 - Member pending obligations

- **Status:** Implemented (2026-10-20)
- **Owner decision date / reference:** 2026-10-20 (show all pending obligations, not only fees; in the Admin member detail **and** in the member's own dashboard; amount = what is still owed; a total with a breakdown plus one section per kind)
- **Related rules:** MEM-10, DASH-11 (new), DASH-07 (changed), MEM-04, MP-03, LOAN-02, LOAN-08, ACT-*, DEMO-02, DEMO-06

## Problem / goal
The member detail page and the member dashboard only show pending monthly fees. A member can also owe loan principal, pending loan interest and the money of activity units assigned to them and not yet paid. MEM-04 already treats all four kinds as "pending obligations" when deactivating a member; the Admin and the member must be able to see them in one place.

## User stories
- As an Admin, I want to see everything a member still owes (fees, loans, interest, activity sales) on the member detail page, so that I can follow up.
- As a Member, I want to see everything I still owe on my dashboard, so that I know what to pay.

## Scope
1. **Definition (MEM-10).** A member's pending obligations are, using the same four kinds as MEM-04:
   - **Monthly fees** with status `Pending`: amount = fee amount.
   - **Loans** with status `Active` where the member is the borrower **and outstanding principal > 0**: amount = outstanding principal (initial amount - non-cancelled payments, LOAN-02). An Active loan whose principal is fully paid but still has Pending interest is not listed as a loan; its interest appears under Loan interest.
   - **Loan interest** (`Performance`) with status `Pending` on the member's loans: amount = interest amount.
   - **Activity assignments** with status `Pending` assigned to the member (activity not cancelled): amount = quantity x sale price (money the member must hand in).
   - **Total owed** = sum of the four amounts. Cancelled records never count. Principal and interest are separate items, so nothing is counted twice.
2. **Backend:** the member detail response (`GET /api/members/{id}/details`, Admin only) and the member dashboard summary (`GET /api/dashboard/summary`, Member role) return the pending obligations: a total, a total and count per kind, and the item lists. Derived on read; nothing stored (FIN-09).
3. **Member detail page (Admin):** the current "Cuotas pendientes" card becomes **"Pendientes por pagar"**: headline "Debe $X" (total), breakdown per kind with counts (Cuotas, Préstamos (capital), Intereses, Ventas de actividades); below, one section per kind listing the items with a link to their detail page (fee -> payments list/period, loan -> `/loans/:id`, interest -> `/loans/:loanId/interest-payments/:id`, assignment -> `/activities/:activityId/assignments/:id`). Kinds with no items are hidden; when nothing is pending: "Está al día. No tiene pagos pendientes."
4. **Member dashboard (Member role):** the pending notice shows the total owed and the per-kind breakdown, with the same sections (links only to pages the member can open). DASH-07 changes from "count of pending fees" to the full pending obligations.
5. **Demo (spec 014):** the demo fixtures add the new fields for the member detail and member dashboard responses, consistent with DEMO-06 (the fixture literals are recomputed by the fixture test).

## Out of scope
Admin dashboard changes; payment reminders or notifications; in-app payments; changing MEM-04 behavior; interest not yet registered (only registered `Pending` interest counts).

## Business rules
- **MEM-10 (new):** pending obligations of a member = Pending fees + Active loans' outstanding principal (only loans with principal > 0) + Pending interest of their loans + Pending activity assignments (qty x sale price, activity not cancelled); total = sum; cancelled records never count; derived, never stored.
- **DASH-11 (new):** the member dashboard shows the member's pending obligations (total, per-kind breakdown and items) per MEM-10.
- **DASH-07 (changed):** superseded by DASH-11 for the member dashboard notice (kept for history).
- Related: MEM-04 (same four kinds), LOAN-02 (outstanding principal), FIN-09 (derived).

## Data model changes
None (no migration). Response contracts change (new fields).

## API
| Verb | Route | Role | Change |
|---|---|---|---|
| GET | `/api/members/{id}/details` | Admin | add `pendingObligations` (see below); `pendingPayments` kept for compatibility |
| GET | `/api/dashboard/summary` | Member | add `pendingObligations`; `pendingPayments` (count) kept |

`pendingObligations`: `{ total, monthlyPayments: { count, amount, items[] }, loans: { count, amount, items[] }, interests: { count, amount, items[] }, activitySales: { count, amount, items[] } }`. Items carry the ids needed for links plus the display fields (period / borrower loan start date / activity name, quantity, sale price, amount). Exact shapes are defined in the plan.

## UI
See Scope 3-4. Brand rules: amounts in JetBrains Mono, COP without decimals; "Debe" headline in the existing amber style of the current pending card; mobile 375 px: breakdown stacks, item rows show concept + amount.

## Acceptance criteria
1. Given a member with 1 Pending fee of 50,000 (the minimum fee in the dev stack), an Active loan with outstanding principal 200,000 and Pending interest 4,000, and a Pending assignment of 8 units at 10,000, When the Admin opens the member detail, Then "Debe $ 334.000" with Cuotas 50.000 (1), Préstamos 200.000 (1), Intereses 4.000 (1), Ventas 80.000 (1), and each item links to its detail.
2. Given cancelled fees, cancelled interest, cancelled assignments, Paid loans or cancelled loans, Then they never appear and never count.
3. Given a member with nothing pending, Then the card shows "Está al día. No tiene pagos pendientes." and total 0.
4. Given the same member logged in as Member, When they open the dashboard, Then they see the same total and breakdown.
5. Given the Admin dashboard, Then it is unchanged.
6. Given the demo (`/demo`), Then the member detail and member dashboard show the pending obligations from the fixtures, consistent with the other fixture figures.
7. `dotnet test` and `npm test` pass; lint/build pass; the member detail and dashboard endpoints keep their existing fields.

## Test plan
- Backend: unit tests for the pending-obligations calculation (MEM-10, DASH-11) covering each kind, cancelled exclusion, Paid loan exclusion, cancelled activity exclusion and the total. Repository query has no automated test (integration tests pending); validator checks it on the Docker stack with "QA ..." data.
- Frontend: Vitest for any pure mapping/formatting; DEMO-06 fixture test extended.
- Manual on the Docker stack: criteria 1-6 at desktop and 375 px.

## Open questions
None. Owner decisions 2026-10-20 (plan review): Active loans with outstanding principal 0 are hidden (their pending interest still counts under interests); fee items link to `/payments` for the Admin and have no link for the Member (MP-09: a Member's payments list shows only Paid fees); the member dashboard shows nothing when nothing is pending; the member reads "Debes $X" (second person), the Admin "Debe $X".
