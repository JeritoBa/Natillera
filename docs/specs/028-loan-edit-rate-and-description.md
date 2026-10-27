# 028 - Loan edit with movements: interest rate and description

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; planner analysis; owner answers: **without movements every field stays editable (as today); with movements (any non-cancelled loan payment or interest) only the description and the interest rate can change and every other field is locked**, also for Paid loans; the Log keeps recording only the amount)
- **Related rules:** LOAN-12 (new); LOAN-07 (changed), LOAN-11 (changed); LOAN-01, LOAN-05, LOAN-10, FIN-05, FIN-13, MEM-07, PER-05

## Problem / goal
Once a loan has a loan payment or an interest, it cannot be edited at all, so a typo in the description or a wrong rate cannot be fixed. The owner wants the description and the interest rate editable at any time, while the amount, borrower and start date stay locked once the loan has movements.

## User stories
- As an Admin, I want to correct a loan's description or interest rate at any time, without affecting the money already registered.

## Scope
1. A non-cancelled loan (Active or Paid) can always change its **interest rate** (LOAN-01 validation) and **description** (LOAN-11), with or without payments/interest.
2. **Without movements** (no non-cancelled loan payment and no non-cancelled interest) every field stays editable as today (LOAN-01, PER-05, FIN-13, MEM-07 when the borrower changes).
   **With movements**, the **initial amount, borrower and start date cannot change**; a request that changes any of them is rejected with 400 and nothing is saved:
   - "The loan amount cannot be changed because the loan has payments or interest." / "The borrower cannot be changed because the loan has payments or interest." / "The start date cannot be changed because the loan has payments or interest."
3. A cancelled loan cannot be edited (as today).
4. Changing the rate never recalculates registered interest (interest is entered manually, LOAN-05; `CalculateMonthlyInterest` is unused, LOAN-10) and never changes the loan's Transaction (its amount is the initial amount; its description keeps the borrower name).
5. Every edit writes exactly one Update Log in the same Unit of Work (FIN-05); old/new value = initial amount (as today with LOAN-11; owner accepted that the old rate is not recorded).
6. When the borrower does not change, the service does not require the borrower to be active (a Paid loan of an inactive member can still fix its description); MEM-07 applies when the borrower changes.
7. Cancelling a loan keeps LOAN-07 (only without non-cancelled payments and interest).
8. UI: "Editar" is offered for every non-cancelled loan; "Anular" keeps its current condition. When the loan has movements, the edit form shows amount, borrower and start date disabled with a note; without movements the form is as today.
9. API: `GET /api/loans` adds `hasMovements: boolean` per item so the form knows which fields are locked.

## Out of scope
Recording the old rate/description in the Log (structured audit); an edit button in the loan detail page.

## Business rules
New: **LOAN-12**. Changed: **LOAN-07** (the edit guard is replaced by LOAN-12; the cancel guard is unchanged), **LOAN-11** (refers to LOAN-12). See `../business-rules.md`.

## Data model changes
None.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/loans` | Admin, Member | unchanged | + `hasMovements` per item |
| PUT | `/api/loans/{id}` | Admin | unchanged body (`borrowerId`, `initialAmount`, `interestRate`, `startDate`, `description`); with movements, borrower, amount and start date must equal the current values | 200 detail; 400 `{ message }` (scope 2 messages, LOAN-01, FIN-13, cancelled loan) |

## UI
- Loans list `/loans`: "Editar" visible for Active and Paid loans.
- Edit modal "Editar préstamo" of a loan **with movements**: Deudor, Monto y Fecha de inicio disabled (`disabled`, `aria-describedby` to the note "Este préstamo ya tiene abonos o intereses: solo se pueden cambiar la tasa de interés y la descripción."), Tasa de interés and Descripción editable. Without movements and in the create modal: unchanged.
- Loan detail: the description help text no longer says it can only be edited without movements.
- Errors with `FormError` (UI-12). Responsive 320-1920 px, targets >= 40 px.

## Acceptance criteria
1. Given a loan with a loan payment, when the Admin changes the rate from 2 to 3 and the description, then both are saved, the loan Transaction amount and description are unchanged, the registered interests are unchanged, and there is exactly one Update Log.
2. Given a loan with only a Pending interest, the same applies.
3. Given a Paid loan whose borrower is now inactive, when the Admin changes the description, then it is saved.
4. Given a loan with movements, when a request changes the amount, the borrower or the start date, then the API answers 400 `{ message }` and nothing is saved; given a loan without movements, those changes are saved as today (with FIN-13 and one Update Log).
5. Given a cancelled loan, every change is rejected.
6. Cancelling a loan with payments is still rejected (LOAN-07).
7. For a loan with movements the edit form shows only rate and description editable; without movements every field is editable; both at 320, 375, 768, 1280 and 1920 px, without horizontal scroll.
8. `dotnet test`, `npm test`, `npm run lint`, `npm run build` pass.

## Test plan
- Domain `LoanTests` and `LoanServiceTests` with `_LOAN12`: rate/description with payments, with Pending interest only, Paid loan with inactive borrower, amount/borrower/start date change with movements rejected without Log, all fields editable without movements, cancelled loan rejected, Transaction unchanged.
- Vitest for any pure helper (e.g. which fields are editable).
- Validator on Docker with "QA ..." data.

## Open questions
None.
