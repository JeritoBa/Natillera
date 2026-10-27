# 027 - Activity assignment created as Paid

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; planner analysis; owner answers: the form offers Pending and Paid, **default Pending**; **responsive is a requirement**)
- **Related rules:** ACT-16 (new); ACT-08 (changed); ACT-05, ACT-06, ACT-07, ACT-10, MEM-07, FIN-05, FIN-08, PER-02, UI-09

## Problem / goal
A member who pays on the spot must today be assigned as Pending and then edited to Paid. Monthly fees can already be created as Paid; assignments should allow the same.

## User stories
- As an Admin, I want to assign units to a member already marked as Paid, so that the sale income is registered in one step.

## Scope
1. `POST /api/activities/{id}/assignments` accepts a required `status` (`Pending` or `Paid`).
2. Created as Paid, in the same Unit of Work: the assignment, its Income Transaction (type `ActivitySale`, amount = quantity assigned x unit sale price, in the activity's period, PER-02), `PaidAt` = creation time, and exactly one Create Log (new value = sale amount).
3. Created as Pending: unchanged (no Transaction, FIN-08).
4. The activity status is refreshed (ACT-10); once a Paid assignment exists the sale price is locked (ACT-05). MEM-07, ACT-06 and ACT-07 apply as today.
5. The "Asignar miembro" form shows the "Estado" radio group (same `StatusRadioGroup` as when editing, hints "Aún no entra a la caja" / "Registra el ingreso en la caja"), default **Pendiente**.

## Out of scope
Partial payments; changing the member of an assignment; changes to editing.

## Business rules
New: **ACT-16**. Changed: **ACT-08** (an assignment may also be created as Paid). See `../business-rules.md`.

## Data model changes
None.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| POST | `/api/activities/{id}/assignments` | Admin | `{ userId, quantityAssigned, status }` (`Pending` or `Paid`, required) | 201 detail; 400 `{ message }` "Assignment status must be Pending or Paid." and the existing ACT/MEM errors |

## UI
- Create modal "Asignar miembro" in the activity detail: fields as today + "Estado" (Pendiente / Pagado), default Pendiente.
- Success messages: Pending "El miembro se asignó correctamente." (current text, keep), Paid "El miembro se asignó y la venta quedó pagada."
- Errors with `FormError` (UI-12). Responsive 320-1920 px, targets >= 40 px, no horizontal page scroll.

## Acceptance criteria
1. Given an activity with available units, when the Admin assigns 4 units as Paid, then the assignment is Paid with `paidAt`, one Income Transaction `ActivitySale` = 4 x price exists in the activity's period, and one Create Log exists.
2. Given the same request as Pending, then there is no Transaction (as today) and one Create Log.
3. Given a Paid assignment that covers all units, then the activity becomes "Cerrada" (ACT-10).
4. Given a request without `status` or with `Cancelled`, then the API answers 400 `{ message }` and nothing is saved.
5. Given a Paid assignment exists, then changing the sale price fails (ACT-05).
6. The form opens with "Pendiente" selected; it works at 320, 375, 768, 1280 and 1920 px.
7. `dotnet test`, `npm test`, `npm run lint`, `npm run build` pass.

## Test plan
- Backend: `CreateAssignmentAsync_Paid_CreatesIncomeTransactionAndPaidAt_ACT16`, `CreateAssignmentAsync_InvalidStatus_Throws_ACT16`, `CreateAssignmentAsync_PaidCoversAllUnits_FinishesActivity_ACT10`, ACT-05 after a Paid creation; existing helpers send `Status = Pending`.
- Validator on Docker with "QA ..." data.

## Open questions
None.
