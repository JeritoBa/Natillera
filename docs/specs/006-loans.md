# 006 - Loans (loans, principal payments, interest)

- **Status:** Implemented (admin management). Member loan requests and approval workflow are **not implemented**.
- **Related rules:** LOAN-01 .. LOAN-10, FIN-03 .. FIN-08, MEM-04, MEM-07

## Problem / goal
The Admin lends fund money to members, registers principal payments and interest, and always knows how much each borrower still owes. Loans never exceed what is owed.

## User stories
- As an Admin, I want to create a loan for an active member with an amount, an interest rate and a start date.
- As an Admin, I want to register, edit and cancel principal payments (cash or transfer).
- As an Admin, I want to register interest as Pending or Paid, mark it as paid, edit and cancel it.
- As a Member, I want to view loans, their payments and interest (read-only).

## Scope
Loan create/update/cancel; loan payment create/update/cancel; interest (`Performance`) create/update/cancel; automatic loan status (Active/Paid); expense/income transactions and logs.

> **Spec 028 supersedes** the "editing a loan with payments or interest fails" criterion: such a loan can still change its interest rate and description (LOAN-12); `GET /api/loans` adds `hasMovements`.

## Out of scope
Member loan requests, approval workflow, automatic interest generation, repayment schedules, in-app payments. (`Loan.CalculateMonthlyInterest` exists in the domain but no flow uses it - LOAN-10.)

## Business rules
LOAN-01 creation, LOAN-02 outstanding principal, LOAN-03 payment limit, LOAN-04 payment transaction, LOAN-05 interest, LOAN-06 automatic status, LOAN-07 edit/cancel guard, LOAN-08 "Total por pagar", LOAN-09 roles, LOAN-10 rounding (open); FIN-05 .. FIN-08, MEM-04 (active loans and pending interest block member deactivation), MEM-07.

## Data model changes
`Loan` (initial amount, interest rate `numeric(9,4)`, start/end date, status Active|Paid|Cancelled, borrower, transaction), `LoanPayment` (amount, paid at, method Cash|Transfer, status Paid|Cancelled, transaction), `Performance` = loan interest (amount, description, status Pending|Paid|Cancelled, nullable paid at / transaction, loan). Index on `LoanPayment.LoanId` and `Performance.LoanId`; unique `TransactionId` on each. Migration `LoanCancellationAndTransactionStatus`.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/loans` | Any authenticated | - | 200 list with borrower, initial amount, rate, start date, status, outstanding principal |
| GET | `/api/loans/{id}` | Any authenticated | - | 200 detail with summary (principal paid/outstanding, interest generated/paid/outstanding, total to pay), payments and interest; 404 |
| POST | `/api/loans` | Admin | `{ borrowerId, initialAmount, interestRate, startDate }` | 201 detail; 400; 404 member not found |
| PUT | `/api/loans/{id}` | Admin | same as POST | 200 detail; 400 (has payments/interest, cancelled, invalid); 404 |
| DELETE | `/api/loans/{id}` | Admin | - | 204 (cancel); 400 (has payments/interest, already cancelled); 404 |
| GET | `/api/loans/{loanId}/payments/{paymentId}` | Any authenticated | - | 200 payment; 404 |
| POST | `/api/loans/{loanId}/payments` | Admin | `{ amount, paymentMethod: Cash or Transfer }` | 201 payment; 400 (exceeds outstanding principal, invalid method, cancelled loan); 404 |
| PUT | `/api/loans/{loanId}/payments/{paymentId}` | Admin | same as POST | 200 payment; 400; 404 |
| DELETE | `/api/loans/{loanId}/payments/{paymentId}` | Admin | - | 204; 400; 404 |
| GET | `/api/loans/{loanId}/interest-payments/{interestId}` | Any authenticated | - | 200 interest; 404 |
| POST | `/api/loans/{loanId}/interest-payments` | Admin | `{ amount, description, status: Pending or Paid }` | 201 interest; 400; 404 |
| PUT | `/api/loans/{loanId}/interest-payments/{interestId}` | Admin | same as POST | 200; 400 (Paid -> Pending, cancelled); 404 |
| DELETE | `/api/loans/{loanId}/interest-payments/{interestId}` | Admin | - | 204; 400; 404 |

Errors map from domain exceptions: message containing "not found" -> 404, otherwise 400.

## UI
- `/loans`: list with month filter (`startDate.slice(0,7)`), borrower, amount, rate, status badge, outstanding principal; Admin has "new loan", edit and "Anular". On mobile: borrower (link to detail) + amount + actions, other data in a small line.
- `/loans/:id`: header "Préstamo de <name>" with status badge; headline block "Total por pagar" with a breakdown (capital pendiente + intereses pendientes); sections "Abonos a capital" and "Intereses" (tables ordered by status; actions to add, edit, mark as paid, "Anular"); "Detalles del préstamo" at the end. Loading / 404 / error-with-retry states; document title with the borrower name.
- `/loans/:loanId/payments/:paymentId` and `/loans/:loanId/interest-payments/:interestId`: detail pages of one payment/interest.
- Member sees the same pages without actions.

## Acceptance criteria
- **Given** an active member, **when** the Admin creates a loan of X, **then** an Expense transaction of X exists, the loan is Active and a Create log is written; an inactive/unknown member is rejected.
- **Given** a loan with outstanding principal P, **when** registering a payment greater than P, **then** it is rejected and nothing is saved.
- **Given** a payment equal to the outstanding principal and no pending interest, **then** the loan becomes Paid with an end date; **given** pending interest, **then** it stays Active until the interest is paid or cancelled.
- **Given** a Paid loan, **when** a payment is cancelled (or new pending interest is added), **then** the loan returns to Active and the end date is cleared.
- **Given** interest registered as Pending, **then** no transaction exists; **when** marked Paid, **then** an Income transaction (type Performance) is created; **when** edited back to Pending, **then** the request fails.
- **Given** a loan with any non-cancelled payment or interest, **when** editing or cancelling the loan, **then** the request fails; **given** none, **then** cancelling cancels the loan and its Expense transaction.
- **Given** a Paid-status interest, **when** cancelled, **then** its transaction is cancelled and the paid-interest totals drop accordingly.
- Every mutation writes exactly one log (LoanPayment / Performance / Loan entity types).

## Test plan
Unit: `LoanTests`, `LoanPaymentTests`, `PerformanceTests`, `LoanServiceTests`; frontend `loanSummary.test.ts`, `labels.test.ts`. Not covered: repository, controllers. Manual: full lifecycle on the Docker stack (loan -> partial payment -> interest -> settle -> cancel a payment).

## Open questions
- LOAN-10: `ToEven` vs `AwayFromZero` rounding; should `CalculateMonthlyInterest` be used or removed?
- Member loan requests and approval workflow (future, would need its own spec and statuses).
- Should interest be allowed on a loan with zero outstanding principal? (Today it is, and it reopens a Paid loan.)
