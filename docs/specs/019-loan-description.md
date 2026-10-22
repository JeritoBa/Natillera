# 019 - Loan description

- **Status:** Implemented (2026-10-21)
- **Owner decision date / reference:** 2026-10-21 (branch `v1.1.0`; max 500 chars; editable; visible to Admin and Members)
- **Related rules:** LOAN-11 (new), LOAN-09, FIN-05, PER-02

## Problem / goal
A loan has no place for additional information (what it is for, agreements with the borrower). The Admin needs an optional free-text description.

## User stories
- As an Admin, I want to add an optional description when I create or edit a loan, so that I keep the information the loan needs.
- As an Admin or Member, I want to read the description in the loan detail, comfortably on any screen.

## Scope
1. `Loan.Description`: optional text, max **500** characters. It is trimmed; empty or whitespace-only is stored as "no description" (null).
2. Set on create and editable on edit (Admin only, LOAN-09), with the same edit rules as the rest of the loan: only while the loan can be edited (LOAN-07: Active and without payments). The loans list response carries the description so the edit form is pre-filled (the list UI does not show it). It does not move money: the loan's transaction is not affected. The loan update keeps writing its one Log (FIN-05).
3. The loan detail shows a "Descripción" block, visible to Admin and Members, that keeps the line breaks and wraps long words, so the text never looks collapsed (layout by the ux-designer). When there is no description, the block shows an empty state (Admin) or is hidden (Member), as the ux-designer specifies.
4. The loan create/edit form gets a textarea "Descripción (opcional)" with a character counter (max 500).

## Out of scope
Rich text, attachments, a description in the loans list, descriptions on other entities, the public demo.

## Business rules
New: LOAN-11. See `../business-rules.md`.

## Data model changes
| Table | Change |
|---|---|
| `loans` | + `Description` varchar(500) NULL |

## API
| Verb | Route | Role | Change |
|---|---|---|---|
| POST | `/api/loans` | Admin | + `description` (optional) |
| PUT | `/api/loans/{id}` | Admin | + `description` (optional; null/empty clears it) |
| GET | `/api/loans/{id}` | Admin, Member | + `description` (null when none) |
| GET | `/api/loans` | Admin, Member | + `description` per item (pre-fills the edit form; not shown in the list) |

A description longer than 500 characters returns 400 with an English message.

## UI
See Scope 3-4. UI copy and layout specified by the ux-designer.

## Acceptance criteria
1. Given the migration, when applied on the Docker dev DB, then `loans."Description"` exists as varchar(500) NULL and existing loans keep all their data (description null).
2. Given the Admin creates a loan with a description, then the loan detail shows it with its line breaks.
3. Given the Admin creates a loan without a description (or only spaces), then it is stored as null and the detail shows the empty state.
4. Given the Admin edits the description of a loan (change or clear), then the detail shows the new value, the loan transaction is unchanged and one Update Log is written.
5. Given a description of 501 characters, then the API returns 400 and the form prevents it (counter at the limit).
6. Given a Member opens the loan detail, then they see the description (read-only).
7. Given a long text without spaces or with many lines, at 375 and 1280 px, then it wraps inside its block with no horizontal scroll.
8. `dotnet test`, `npm test`, `npm run lint` and `npm run build` pass.

## Test plan
- Backend: domain tests for the description (trim, empty -> null, 500 ok, 501 throws) and service tests for create/update (LOAN-11).
- Frontend: Vitest for any pure helper (e.g. counter/normalization).
- Manual on the Docker stack: criteria 1-7 with "QA ..." data, Admin and Member.

## Open questions
None. Owner decision 2026-10-21 (plan review): option A, the description follows the existing loan edit rules (LOAN-07).
