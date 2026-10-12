# 003 - Monthly payments (cuotas)

- **Status:** Implemented
- **Related rules:** MP-01 .. MP-09, FIN-03, FIN-05 .. FIN-08, MEM-07

## Problem / goal
Register each member's monthly fee, track which are pending, and record the money movement only when the fee is actually paid.

## User stories
- As an Admin, I want to register a fee for a member and month as Pending or Paid.
- As an Admin, I want to mark a Pending fee as Paid, edit it, or cancel ("Anular") it.
- As a Member, I want to see the fees that have been paid.

## Scope
Create, update (including Pending -> Paid), cancel; list with role-dependent visibility; minimum amount from configuration; income transaction and log entry per mutation.

## Out of scope
In-app/online payment, automatic fee generation each month, late fees, reminders beyond the dashboard notice (spec 008).

## Business rules
MP-01 amount/minimum, MP-02 period, MP-03 initial status, MP-04 one live fee per member/month, MP-05 Pending has no transaction, MP-06 Pending -> Paid, MP-07 Paid -> Pending forbidden, MP-08 cancel, MP-09 visibility; FIN-05 (one log per mutation), MEM-07 (active member only).

## Data model changes
`MonthlyPayment`: `Status` Pending|Paid|Cancelled, nullable `PaidAt` and `TransactionId`, unique index (`UserId`,`Year`,`Month`) filtered to `Status <> 'Cancelled'` (migration `MonthlyPaymentPendingAndCancellation`).

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/monthly-payments` | Any authenticated | - | 200 list ordered by `PaidAt ?? CreatedAt` desc; Admin: all statuses; Member: Paid only |
| POST | `/api/monthly-payments` | Admin | `{ userId, year, month, amount, status: Pending or Paid }` | 201 payment; 400; 409 period already registered |
| PUT | `/api/monthly-payments/{id}` | Admin | same as POST | 200 payment; 400; 404; 409 |
| DELETE | `/api/monthly-payments/{id}` | Admin | - | 204 (cancel); 400 (already cancelled); 404 |

## UI
- `/payments` (sidebar "Cuotas"): table with member, month, amount, payment date, status badge. Admin has a modal "Nueva cuota mensual" / "Editar cuota mensual" (member select of active members, month, year, amount, status select defaulting to Pagada) and per-row edit and "Anular" actions (confirm dialog "¿Anular esta cuota?..."). The status select is disabled when editing an already paid fee. Cancelled rows show no actions.
- Member view: only paid fees, no actions.
- Mobile: member name + month/status/date in a small line; amount and actions remain visible.

## Acceptance criteria
- **Given** an active member and a free period, **when** the Admin creates a fee as Paid, **then** the fee is Paid with `PaidAt`, an Income transaction (type MonthlyPayment) exists, and one Create log is written.
- **Given** the same inputs but status Pending, **then** no transaction exists until it is marked Paid.
- **Given** a Pending fee, **when** edited with status Paid, **then** an Income transaction is created and linked (an existing live one is reused; a cancelled one makes the request fail).
- **Given** a Paid fee, **when** edited back to Pending, **then** the request fails.
- **Given** a live fee for the same member/year/month, **when** creating another, **then** 409 "A monthly payment already exists for this member and period.".
- **Given** a cancelled fee for a period, **when** creating a new one for the same period, **then** it succeeds.
- **Given** an amount below `NATILLERA_MIN_MONTHLY_PAYMENT`, **then** the request fails stating the minimum.
- **Given** a Pending or Paid fee, **when** cancelled, **then** status is Cancelled, its live transaction (if any) is cancelled, and one Delete log is written; cancelling again fails.
- **Given** a Member, **when** listing fees, **then** only Paid fees are returned.

## Test plan
Unit: `MonthlyPaymentTests`, `MonthlyPaymentServiceTests` (cover MP-01..MP-08). Not covered: the partial unique index and the list visibility (need integration tests). Manual: duplicate-period race and re-registration after cancel.

## Open questions
None.
