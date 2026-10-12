# 007 - Activities and assignments

- **Status:** Implemented
- **Related rules:** ACT-01 .. ACT-12, FIN-03 .. FIN-08, MEM-04, MEM-07, DASH-03/04/10

## Problem / goal
The natillera buys goods (for example raffle tickets or food) with fund money, assigns units to members to sell, and records the income as each assignment is paid. The Admin sees the real result (profit) of every activity.

## User stories
- As an Admin, I want to create an activity with quantity, unit cost and unit sale price, and edit or cancel it.
- As an Admin, I want to assign units to active members, mark an assignment as paid, adjust it while pending, or cancel it.
- As a Member, I want to see activities, my assignments and the sellers ranking (read-only).

## Scope
Activity create/update/cancel; assignment create/update(quantity, status)/cancel; automatic activity status; expense and income transactions; logs; summary figures in the detail page.

## Out of scope
An `ActivitySale` entity (the assignment is the sale record), per-unit sale tracking, partial payments of an assignment, changing the member of an assignment (cancel and re-assign instead).

## Business rules
ACT-01 .. ACT-12; FIN-05 .. FIN-08; MEM-04 (pending assignments block deactivation); DASH-03/04/10 (earnings and ranking).

## Data model changes
`Activity` (name, description, quantity, unit cost, unit sale price, start date, status Pending|Finished|Cancelled, transaction), `ActivityAssignment` (quantity assigned, assigned at, status Pending|Paid|Cancelled, nullable paid at and transaction, activity, user). Indexes on `ActivityId` and `UserId`; unique `TransactionId`. Migration `ActivityAssignmentOptionalTransaction`.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/activities` | Any authenticated | - | 200 list (quantities, cost/price, total cost, assigned/available, start date, status) |
| GET | `/api/activities/{id}` | Any authenticated | - | 200 detail with assignments; 404 |
| POST | `/api/activities` | Admin | `{ name, description, quantity, unitCost, unitSalePrice, startDate }` | 201 detail; 400 |
| PUT | `/api/activities/{id}` | Admin | same as POST | 200 detail; 400 (below assigned, price change with paid assignments, cancelled); 404 |
| DELETE | `/api/activities/{id}` | Admin | - | 204 (cancel); 400 (has non-cancelled assignments); 404 |
| GET | `/api/activities/{activityId}/assignments/{assignmentId}` | Any authenticated | - | 200 assignment; 404 |
| POST | `/api/activities/{activityId}/assignments` | Admin | `{ userId, quantityAssigned }` | 201 assignment; 400 (duplicate member, exceeds available, inactive member); 404 |
| PUT | `/api/activities/{activityId}/assignments/{assignmentId}` | Admin | `{ quantityAssigned, status: Pending or Paid }` | 200 assignment; 400 (not pending, Paid -> Pending); 404 |
| DELETE | `/api/activities/{activityId}/assignments/{assignmentId}` | Admin | - | 204; 400; 404 |

Errors map from domain exceptions: message containing "not found" -> 404, otherwise 400.

## UI
- `/activities`: list with month filter (`startDate.slice(0,7)`), name, units, price, status badge ("Cerrada" for Finished); Admin has create/edit/"Anular". Mobile: name (link to detail) + amount + actions.
- `/activities/:id`: header with name and badge; headline block with **Ganancia neta** (net profit = collected - total cost) and `<dl>` breakdown (Recaudado, Ganancia bruta, por cobrar / "Asignadas sin pagar", Unidades, Sin asignar); "Asignaciones" table ordered by status (Pending first) with add, edit, mark paid, "Anular"; "Detalles de la actividad" at the end.
- `/activities/:activityId/assignments/:assignmentId`: assignment detail.
- Members see the same pages without actions.

## Acceptance criteria
- **Given** valid data, **when** the Admin creates an activity, **then** an Expense transaction of quantity x unit cost exists, the activity is Pending, and a Create log is written; a price below cost is rejected.
- **Given** an activity with available units, **when** assigning a quantity to an active member without a live assignment, **then** the assignment is Pending, no transaction exists and a log (`ActivityAssignment`) is written.
- **Given** a member with a live assignment, **when** assigning again, **then** it is rejected; **given** the earlier assignment was cancelled, **then** it is allowed.
- **Given** a Pending assignment, **when** marked Paid, **then** an Income transaction of quantity x unit sale price exists; **when** later set back to Pending or its quantity edited, **then** the request fails.
- **Given** all units assigned and all live assignments Paid, **then** the activity becomes Finished; **when** a paid assignment is cancelled, **then** its transaction is cancelled and the activity returns to Pending.
- **Given** an activity with live assignments, **when** cancelling it, **then** it fails; **given** none, **then** the activity and its Expense transaction are cancelled.
- **Given** an activity with paid assignments, **when** changing the unit sale price, **then** it fails; changing quantity below the assigned total also fails.
- **Given** a Member with Pending assignments, **when** the Admin deactivates them, **then** it fails (MEM-04).

## Test plan
Unit: `ActivityTests`, `ActivityAssignmentTests`, `ActivityServiceTests`; frontend `activitySummary.test.ts`. Manual: end-to-end sale cycle on the Docker stack, including cancel of a paid assignment.

## Open questions
- `Activity.Finish()` is unused (status is automatic); remove or keep?
- Should a Finished activity be re-openable by editing quantity? (Today status is recomputed on every change.)
