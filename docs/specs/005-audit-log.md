# 005 - Audit log

- **Status:** Implemented (the detail enrichment only covers monthly payments)
- **Related rules:** FIN-05, FIN-10, AUD-01 .. AUD-03

## Problem / goal
The Admin can answer "who did what, when and with which values" for every financial operation.

## User stories
- As an Admin, I want a chronological history of every create, update and cancellation, with old and new values and the user.
- As an Admin, I want to open an entry and see the entity it refers to.

## Scope
Automatic `Log` creation by each financial service in the same Unit of Work as the change; admin-only list and detail views.

## Out of scope
Logging of member management changes (MEM-08, open), exporting, filtering on the server, edit/delete of logs (logs are immutable).

## Business rules
FIN-05 (one log per mutation, same UoW), FIN-10 (immutable), AUD-01 (admin only), AUD-02 (summary only for monthly payments), AUD-03 (folder naming trap).

## Data model changes
`Log`: `EntityType` (MonthlyPayment, Activity, ActivityAssignment, Loan, LoanPayment, Performance, Transaction), `EntityId`, `Action` (Create, Update, Delete = cancel), `OccurredAt`, `OldValue`, `NewValue` (decimal amounts), `UserId`. Indexes on (`EntityType`,`EntityId`), `OccurredAt`, `UserId`. `Transaction` exists as an entity type but no service writes it today. The old `ActivitySale` log type was renamed `ActivityAssignment`.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/logs` | Admin | - | 200 list newest first (entity type/id, action, date, old/new value, user id and name) |
| GET | `/api/logs/{id}` | Admin | - | 200 detail with user name/email and an entity summary; 404 |

## UI
- `/logs` (sidebar "Logs", Admin only): list with a free-text search (user, entity, action, id, amount), entity-type/action filters and a date filter, entity-type and action badges, old -> new value, user, date. `/logs/:id`: detail page following the standard detail pattern.
- Frontend feature folder is `features/audit` (never name a folder `logs`).

## Acceptance criteria
- **Given** any create/update/cancel of a financial entity, **then** exactly one log is stored with the acting user (from the JWT), the action and old/new amounts.
- **Given** a mutation that fails and rolls back, **then** no log remains.
- **Given** a cancellation, **then** the log action is `Delete` and `NewValue` is empty.
- **Given** a Member, **when** requesting `/api/logs`, **then** 403; the Logs menu entry is hidden.
- **Given** a log of a monthly payment, **when** opening its detail, **then** member, period, status, amount and transaction are summarized.

## Test plan
Unit: `LogTests`; log assertions inside each service test class. Manual: verify one log per mutation on the Docker stack.

## Open questions
- Enrich the detail summary for loans, activities and assignments.
- Log member management changes (MEM-08).
