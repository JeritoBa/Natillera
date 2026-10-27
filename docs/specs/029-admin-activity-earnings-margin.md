# 029 - Admin activity earnings = margin of paid sales

- **Status:** Implemented (2026-10-27)
- **Owner decision date / reference:** 2026-10-27 (branch `v1.1.2`; the owner clarified spec 021: "Ganancias de actividades" must never be negative, it subtracts nothing and only records what has been earned so far; the only figure with a subtraction is the loan interest minus extra costs)
- **Related rules:** DASH-03 (changed), DASH-13; ACT-01, ACT-11, ACT-15, DASH-12, DEMO-06

## Problem / goal
Spec 021 defined the Admin's "Ganancias de actividades" as the activities' net profit (collected - total cost), which is negative while an activity has unsold or unpaid units. The owner wants the figure to show only what has been earned so far.

## Scope
1. Admin `activityEarnings` (DASH-03) = SUM of margin `quantity x (unit sale price - unit cost)` of the `Paid` assignments of non-cancelled activities of the period (the "Ganancia bruta" of each activity detail, ACT-11). Never negative (ACT-01: price >= cost). Nothing is subtracted; extra costs keep reducing only "Rendimientos de préstamos" (DASH-12, ACT-15).
2. Dashboard breakdown row "Ganancias de actividades": secondary line "Margen de las ventas pagadas"; always green, no negative handling.
3. Demo fixtures: `activityEarnings` = 88.000 (22 paid units x 4.000).

## Out of scope
Member figures (DASH-04/05), activity detail figures (ACT-11), the other breakdown rows.

## Data model changes
None.

## API
`GET /api/dashboard/summary` (Admin): `activityEarnings` changes meaning as in Scope 1. Contract unchanged.

## Acceptance criteria
1. Given an activity with paid and unpaid units, then "Ganancias de actividades" equals the sum of the "Ganancia bruta" of the non-cancelled activities of the period and is never negative.
2. Creating a Pending assignment or an extra cost does not change it; marking an assignment Paid raises it by its margin.
3. The demo Admin dashboard shows $ 88.000.
4. `dotnet test`, `npm test`, `npm run lint`, `npm run build` pass.

## Test plan
`demoFixtures.test.ts` (DEMO-06 / DASH-03), `sourceBreakdown.test.ts`; repository query validated on Docker.

## Open questions
None.
