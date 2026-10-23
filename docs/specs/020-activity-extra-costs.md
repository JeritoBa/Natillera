# 020 - Activity extra costs

- **Status:** Implemented (2026-10-23)
- **Owner decision date / reference:** 2026-10-21 (branch `v1.1.0`; amount is decimal like every other amount; status Pending/Paid/Cancelled; managed from the activity detail)
- **Related rules:** ACT-13, ACT-14, ACT-15, DASH-12, FIN-14 (new); DASH-03, DASH-04, DASH-06, DASH-09, FIN-06, FIN-07, FIN-08, FIN-13, ACT-03, ACT-11, PER-02, PER-06, TX-02, AUD-02

> **This feature changes how the members' earnings are computed:** the interest shared among the members is now the period's paid interest **minus** its paid extra costs (DASH-12).

## Problem / goal
An activity can carry extra costs (e.g. delivery) that today cannot be recorded. Those costs come out of the loan interest earned (the "performances"), so the earnings shared among the members must reflect them.

## User stories
- As an Admin, I want to register the extra costs of an activity, as Pending or Paid, so that they are linked to it and recorded.
- As an Admin or Member, I want to see the extra costs in the activity detail.
- As a Member, I want my interest share to reflect the extra costs, so that it shows what I really earn.

## Scope

### Entity (ACT-13)
1. New entity **`ExtraCost`**: `Id`, `Description` (required, max 200), `Amount` decimal(18,2) > 0, `Status` (`Pending`, `Paid`, `Cancelled`), `CreatedAt`, `PaidAt` (when Paid), `ActivityId` (FK), `TransactionId` (nullable, unique).
2. It belongs to its activity's saving period (PER-02); it has no period column of its own.
3. Same lifecycle as the other pending items (FIN-08): a **Pending** extra cost has no Transaction; when it is created as **Paid** or moves `Pending -> Paid`, an **Expense** Transaction of new type `ExtraCost` is created (in the activity's period). `Paid -> Pending` is forbidden. Editing a Paid extra cost updates its Transaction; cancelling cancels it (FIN-06). Cancelled is terminal (FIN-07).
4. Every create, update and cancel writes **one Log** (new `LogEntityType.ExtraCost`) in the same Unit of Work.
5. Editable while not cancelled (description, amount, status).

### Activity (ACT-14, ACT-15)
6. An extra cost cannot be added to, or edited on, a cancelled activity. An activity with non-cancelled extra costs (Pending or Paid) cannot be cancelled (as ACT-03 for assignments).
7. Extra costs do **not** change the activity's own figures (ACT-11 cost, outstanding, collected, gross and net profit stay as today).

### Interest pool (DASH-12, FIN-14)
8. **Shared interest pool** of a period = SUM(Paid interest) - SUM(Paid extra costs), never below 0. Pending and cancelled extra costs do not count (they have not moved money).
9. The interest share (DASH-06) divides the pool instead of the paid interest: the Admin dashboard, "Mis ahorros" (DASH-04), and the member detail balance (DASH-09) all use it.
10. **Pool guard (FIN-14)**, inside the same Unit of Work, rejecting the whole operation:
    - Making an extra cost Paid (create as Paid, `Pending -> Paid`) or raising the amount of a Paid one is rejected when the amount exceeds the pool (on edit, the pool plus the cost's previous paid amount).
    - Cancelling a Paid loan interest, or lowering its amount, is rejected when it would leave the pool below 0.
    - Cancelling an extra cost is always allowed.
11. **Available money (FIN-13)** also applies: making an extra cost Paid or raising a Paid amount is rejected when it exceeds the period's available money.
12. The Admin dashboard shows the **net** pool as the headline and, below it, the **gross** paid interest.

### Traceability (TX-02, AUD-02)
13. The transaction detail and the log detail of an extra cost show its activity.

### UI
14. The activity detail gets a "Costos extra" section: list (description, amount, status, date), and for the Admin "Agregar", edit and "Anular". Members see it read-only. Layout and copy by the ux-designer.

## Out of scope
Extra costs on parents other than activities; the public demo; changes to the activity's own figures; idempotency.

## Business rules
New: ACT-13, ACT-14, ACT-15, DASH-12, FIN-14. Changed: DASH-03, DASH-06 (pool), FIN-08 (adds extra costs to the pending items), FIN-13 (adds extra costs), ACT-03 (activity cancel also blocked by extra costs), TX-02, AUD-02. See `../business-rules.md`.

## Data model changes
| Table | Change |
|---|---|
| `extra_costs` (new) | `Id`, `Description` varchar(200), `Amount` numeric(18,2), `Status` varchar(20), `CreatedAt`, `PaidAt` NULL, `ActivityId` FK -> activities (indexed, RESTRICT), `TransactionId` FK -> transactions NULL (UNIQUE, RESTRICT) |
| enums (strings) | `TransactionType.ExtraCost`, `LogEntityType.ExtraCost`, `ExtraCostStatus` (`Pending`, `Paid`, `Cancelled`) |

## API
All period-scoped (`X-Saving-Id`, PER-04); the activity must belong to the selected period (strict 404).

| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/activities/{id}/extra-costs` | Admin, Member | - | list |
| GET | `/api/activities/{id}/extra-costs/{costId}` | Admin, Member | - | detail |
| POST | `/api/activities/{id}/extra-costs` | Admin | `{ description, amount, status }` (`Pending` or `Paid`) | 201 detail; 400 ACT-13/14, FIN-13, FIN-14 |
| PUT | `/api/activities/{id}/extra-costs/{costId}` | Admin | `{ description, amount, status }` | 200 detail; 400 as above |
| DELETE | `/api/activities/{id}/extra-costs/{costId}` | Admin | - | 204 (cancel, never physical delete; same verb as the other cancellations) |
| GET | `/api/activities/{id}` | Admin, Member | - | + extra costs |
| GET | `/api/dashboard/summary` | Admin | - | + `sharedInterestPool` (net) and `paidExtraCosts`; `loanInterestEarned` stays gross |

Errors use the app format `{ "message": "..." }` (OPS-05).

## Acceptance criteria
1. Given an active activity, when the Admin adds a Pending extra cost, then it is listed as Pending with no Transaction and one ExtraCost Create Log.
2. Given pool >= X and available money >= X, when the Admin adds a Paid extra cost of X, then an Expense Transaction of type `ExtraCost` exists in the activity's period, and the available money and the net pool both fall by X.
3. Given pool P, when the Admin adds a Paid extra cost greater than P, then the API returns 400 `{ message }` and nothing is saved.
4. Given a Pending extra cost, when it is marked Paid, then its Transaction is created; given a Paid one, setting it back to Pending returns 400.
5. Given a Paid extra cost of A raised to B with B - A > pool, then 400; when it is lowered, its Transaction is updated.
6. Given a Paid extra cost, when it is cancelled, then its Transaction is cancelled and the pool and available money are restored, even when the pool is 0.
7. Given an activity with a Pending or Paid extra cost, cancelling the activity returns 400; on a cancelled activity, adding or editing an extra cost returns 400.
8. Given paid interest I and paid extra costs C, the Admin dashboard shows max(0, I - C) with the gross I and C below it; "Mis ahorros" and the member detail use the same share, round((I - C) / active members).
9. Given a Paid interest whose cancellation or reduction would leave the pool below 0, then 400.
10. The transaction detail and the log detail of an extra cost show its activity and never return 500.
11. With another period selected, every extra-cost route of an activity returns 404; Members get 403 on POST/PUT/DELETE and can read the list.
12. The activity's own figures (cost, collected, net profit) do not change when extra costs are added.
13. In the activity detail at 375 and 1280 px, the Admin can add, edit and cancel extra costs and a Member sees them read-only; the public demo still works.
14. `dotnet test`, `npm test`, `npm run lint` and `npm run build` pass.

## Test plan
- Backend unit tests per rule ID (ACT-13..15, DASH-12, FIN-14, FIN-13 for extra costs, FIN-08 transitions), with in-memory fakes.
- Frontend Vitest for pure helpers (e.g. extra cost totals, form validation).
- Validator on the Docker stack: Admin and Member, "QA ..." data, mobile and desktop.

## Open questions
None.
