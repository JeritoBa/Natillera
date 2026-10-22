# 008 - Dashboard

- **Status:** Implemented (redesigned)
- **Related rules:** DASH-01 .. DASH-10, FIN-09

## Problem / goal
On sign-in each role immediately sees the figures that matter: the Admin sees the natillera's health, the Member sees how much they have saved and earned and what they still owe.

## User stories
- As an Admin, I want to see available money, total balance, money lent, money in activities and the returns of loans and activities.
- As a Member, I want to see the available money, my savings, my earnings and my pending fees.
- As any user, I want to see recent movements and the top sellers.

## Scope
One read-only endpoint whose response depends on the caller's role; the dashboard page; the pending-fees notice for members.

## Out of scope
Charts over time, push/email reminders for pending fees, per-month comparisons.

## Business rules
DASH-01 available money, DASH-02 total balance, DASH-03 interest earned and activity earnings, DASH-04 "Mis ahorros", DASH-05 "Mis ganancias", DASH-06 interest share, DASH-07 pending fees notice, DASH-08 recent movements, DASH-09 consistency with member detail, DASH-10 top 10 sellers; FIN-09.

## Data model changes
None (all values are derived from existing tables).

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/dashboard/summary` | Any authenticated | - | 200 `DashboardSummaryResponse`: always `role`, `availableMoney`, `recentTransactions[10]`, `topSellers[<=10]`. Admin adds `totalNatilleraBalance`, `lentMoney`, `pendingActivitiesInvestment`, `loanInterestEarned`, `activityEarnings`. Member adds `mySavings`, `myEarnings`, `pendingPayments`, `pendingObligations` (MEM-10, DASH-11, spec 016), `myPaidMonthlyPayments`, `myActivityEarnings`, `myPerformanceShare`. Fields of the other role are `null`. 401 if the token has no valid user id. |

## UI
- `/dashboard` (first page after login). Admin: "Dinero disponible" and "Dinero total de la natillera" (available + lent + activities), breakdown "Prestado (por recuperar)" and "En actividades (por cobrar)", "Rendimiento de la natillera" with "Rendimientos de préstamos" and "Ganancias de actividades". Member: "Dinero disponible", "Mis ahorros" (with "Cuotas pagadas", "Ganancia en actividades", interest share), earnings, and the pending-fees notice. Both: "Top 10 de ventas" (ranking by earnings) and "Movimientos recientes" with "Ver todos los movimientos" (links to `/transactions`). Empty and loading states for each block.
- Figures use the monospace font; negative values only with "-".

## Acceptance criteria
- **Given** non-cancelled transactions, **then** `availableMoney` equals SUM(income) - SUM(expense); cancelling an entity lowers/raises it accordingly.
- **Given** an Admin, **then** `totalNatilleraBalance` = available + outstanding principal of active loans + cost of pending assignments.
- **Given** a Member with paid fees, assignments and shared interest, **then** `mySavings` = paid fees + activity margin (pending included) + interest share, and equals `balance.total` on the Admin's member detail page; loan payments never change it.
- **Given** 3 active members and 100.00 of paid interest, **then** each interest share is 33.33 (rounded AwayFromZero); with no active members the share is 0.
- **Given** a Member with 2 Pending fees, **then** `pendingPayments` is 2.
- **Given** more than 10 sellers, **then** only the top 10 appear, ordered by earnings, then collected, then name.

## Test plan
Unit: only the member-detail equivalent (`MemberDetailServiceTests`). The dashboard repository queries have no automated tests (integration tests pending) - validate manually on the Docker stack by comparing with transactions and member detail.

## Open questions
- Should "pending activities investment" use the cost of Pending assignments (current) or of unassigned stock too?
