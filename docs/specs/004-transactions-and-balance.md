# 004 - Transactions and balance

- **Status:** Implemented
- **Related rules:** TX-01, TX-02, FIN-02 .. FIN-09, DASH-01

## Problem / goal
Everyone in the natillera can see where the money came from and went to, and the available balance is always derived from the authoritative transaction records.

## User stories
- As a Member, I want to see all transactions of the natillera so the management is transparent.
- As an Admin, I want to open any transaction and see the business entity that produced it.

## Scope
Read-only ledger (list + detail). Transactions are **created, updated and cancelled only as a side effect** of other features (monthly payments, loans, loan payments, interest, activities, assignments); there is no endpoint to create or edit a transaction.

## Out of scope
Manual transactions, editing or deleting transactions, export, server-side filtering/pagination (the list is returned whole and filtered in the UI).

## Business rules
FIN-02 (amount > 0), FIN-03 (1:1 with entity), FIN-04 (type/direction per source), FIN-06 (cancelled excluded from balances), FIN-09 (derived balance), TX-01, TX-02.

## Data model changes
`Transaction`: `Amount` > 0, `Direction` Income|Expense, `Type` MonthlyPayment|Activity|ActivitySale|Loan|LoanPayment|Performance, `OccurredAt`, `Description` <= 200, `IsCancelled`. Index on `OccurredAt`.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/transactions` | Any authenticated | - | 200 list newest first, each with amount, direction, type, date, description, related member name, `isCancelled` |
| GET | `/api/transactions/{id}` | Any authenticated | - | 200 detail with a `source` object (entity type/id, member, period/status/dates, loan or activity figures); 404 |

## UI
- `/transactions`: ledger with a transaction-type filter (applied in the UI), income/expense styling, cancelled transactions flagged. Same for both roles. Negative amounts use only the "-" sign.
- `/transactions/:id`: header with description and status, headline block with the amount, breakdown of the source entity, details section; loading / 404 / error states.

## Acceptance criteria
- **Given** a paid monthly payment, **when** opening its transaction, **then** the detail shows the member, the year/month and the payment status.
- **Given** a cancelled entity, **when** listing transactions, **then** its transaction still appears flagged as cancelled and is not counted in the available money.
- **Given** any mutation that creates money movement, **then** exactly one transaction exists for the entity and the available money changes by its signed amount.
- **Given** a Member, **when** listing or opening transactions, **then** it works (read-only).

## Test plan
Unit: `TransactionTests`; transaction side effects are asserted in each module's service tests. Not covered: repository queries and the detail resolution (integration tests pending). Manual: compare the dashboard available money with the sum of non-cancelled transactions after a QA flow.

## Open questions
- Server-side filtering/pagination when volume grows.
