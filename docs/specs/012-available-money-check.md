# 012 - Available money check before money leaves the cash

- **Status:** Implemented (backend)
- **Owner decision date / reference:** 2026-10-12 (scope: any create/edit except cancel; reaching 0 allowed; concurrency risk accepted for now)
- **Related rules:** FIN-13 (new), FIN-09, DASH-01, FIN-05, FIN-06, FIN-11, LOAN-01, LOAN-07, ACT-02, MP-07, LOAN-04, LOAN-05

## Problem / goal
Today the Admin can register a loan or an activity for more money than the natillera has, leaving the available money (cash) negative. Since balances are derived (FIN-09), the only way to keep the cash consistent is to reject, at registration time, any operation that takes out more money than is available.

## User stories
- As an Admin, I want the system to reject a loan, an activity or an edit when the cash does not have enough money, so that the available money never goes negative.
- As an Admin, I want the error to tell me how much is available and how much the operation needs, so that I can correct the amount.

## Scope
Backend only in this phase (frontend in a later, separately approved phase). Every **create or edit** that reduces the available money is checked:

| Operation | Cash outflow checked |
|---|---|
| Create loan | `InitialAmount` |
| Edit loan | `newInitialAmount - oldInitialAmount` (only if > 0) |
| Create activity | `Quantity x UnitCost` |
| Edit activity | `newTotalCost - oldTotalCost` (only if > 0) |
| Edit a **Paid** monthly payment | `oldAmount - newAmount` (only if > 0) |
| Edit a loan payment | `oldAmount - newAmount` (only if > 0) |
| Edit a **Paid** loan interest | `oldAmount - newAmount` (only if > 0) |

Operations whose outflow is <= 0 (they add money or do not change it) are not checked.

## Out of scope
- **Cancellations ("Anular")** are never blocked by this rule, even if cancelling an income (e.g. a paid fee) leaves the cash negative. Owner decision: correcting a wrong record must always be possible.
- Concurrency protection: two simultaneous operations could both pass the check (risk accepted by the owner; to be solved with FIN-11 RowVersion or a lock later).
- Reserve/minimum cash amount (not requested).
- Frontend changes (next phase).

## Business rules
- **FIN-13 (new):** a create or edit that reduces the available money is rejected when the outflow is greater than the available money (`outflow > available`). Reaching exactly 0 is allowed. Available money = DASH-01 (SUM Income - SUM Expense of non-cancelled transactions), computed **before** the change. Cancellations are exempt.
- FIN-05: the check runs inside the same Unit of Work as the write; a rejection saves nothing (no entity, no Transaction, no Log).

## Data model changes
None.

## API
No new endpoints. The affected endpoints (`POST/PUT` loans, `PUT` loan payments, `PUT` loan interest, `POST/PUT` activities, `PUT` monthly payments) may now answer:

| Status | Body |
|---|---|
| 400 | `{ "message": "Insufficient available money. Available: 1,200,000; required: 1,500,000." }` |

Numbers in the message use invariant format `N0` (thousands with ",", no decimals). The message is English and is shown as-is by the frontend (UI-03).

## UI
None in this phase. (Next phase: the existing error display of each form already shows the backend message; the owner will decide later on showing the available money in forms.)

## Acceptance criteria
1. Given available money 1,000,000, When the Admin creates a loan of 1,500,000, Then 400 with the insufficient-money message; no loan, no Transaction and no Log are created.
2. Given available money 1,000,000, When the Admin creates a loan of exactly 1,000,000, Then it is created and the available money becomes 0.
3. Given available money 100,000, When the Admin creates an activity with quantity 10 and unit cost 20,000 (total 200,000), Then 400 and nothing is saved.
4. Given an existing loan of 300,000 (no payments) and available money 100,000, When the Admin edits it to 500,000 (outflow 200,000), Then 400; When they edit it to 400,000 (outflow 100,000), Then it is saved.
5. Given an activity whose total cost goes down on edit, Then no check is made and it is saved.
6. Given a Paid monthly payment of 100,000 and available money 30,000, When the Admin edits it to 50,000 (outflow 50,000), Then 400; editing it to 150,000 is always allowed.
7. Given the same situation for a loan payment and for a Paid loan interest, Then the same behavior as criterion 6.
8. Given a Pending monthly payment or Pending interest, When its amount is edited, Then no check is made (it has no Transaction).
9. Given any Paid income whose cancellation would leave the cash negative, When the Admin cancels it, Then the cancellation succeeds (cancellations are exempt).
10. Every successful mutation still writes exactly one Log (FIN-05); a rejected one writes none.

## Test plan
- Unit tests (xUnit with fakes) referencing `FIN-13`: `LoanServiceTests` (create over/equal/under, update increase over/within, payment decrease over, interest decrease over), `ActivityServiceTests` (create over/equal, update increase over, update decrease skips check), `MonthlyPaymentServiceTests` (paid decrease over, pending edit skips check), and a test proving cancellations are not checked. Rejections assert that no Transaction/Log was added.
- The available-money query (Infrastructure) has no automated test (integration tests pending); validator checks it on the Docker stack with "QA ..." data.

## Open questions
None (decided by the owner on 2026-10-12).
