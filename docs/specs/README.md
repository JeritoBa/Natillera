# Feature Specs

One spec per feature. Specs describe **what the system must do** (behavior, rules, API, UI, acceptance criteria), not how the code is organized. The rules themselves live in [`../business-rules.md`](../business-rules.md) and are referenced here by ID.

## Spec-driven workflow

1. **New feature or rule change:** create/update the spec here and the rules in `business-rules.md` *first*, and get the owner's approval.
2. `planner` reads the spec and produces the implementation plan.
3. `build` implements; tests reference rule IDs in names or comments when practical.
4. `validator` checks the spec's acceptance criteria against the running Docker dev stack.
5. When behavior changes, update the spec and the rule catalogue in the same change.

## Index

| # | Spec | Status | Main rules |
|---|---|---|---|
| 001 | [Authentication](001-authentication.md) | Implemented | AUTH-* |
| 002 | [Members](002-members.md) | Implemented | MEM-* |
| 003 | [Monthly payments](003-monthly-payments.md) | Implemented | MP-*, FIN-* |
| 004 | [Transactions and balance](004-transactions-and-balance.md) | Implemented | TX-*, FIN-* |
| 005 | [Audit log](005-audit-log.md) | Implemented (partial detail) | AUD-*, FIN-05 |
| 006 | [Loans](006-loans.md) | Implemented (no member requests) | LOAN-* |
| 007 | [Activities](007-activities.md) | Implemented | ACT-* |
| 008 | [Dashboard](008-dashboard.md) | Implemented | DASH-* |
| 009 | [Landing page and login UI](009-landing-and-auth-ui.md) | Implemented | UI-07, AUTH-03/04 |
| 010 | [Mobile responsive](010-mobile-responsive.md) | Implemented | UI-06 |
| 011 | [Admin-friendly forms and navigation](011-admin-friendly-forms.md) | Implemented | UI-08..11, UI-03, MEM-04 |
| 012 | [Available money check](012-available-money-check.md) | Implemented (backend) | FIN-13 |
| 013 | [Production deployment readiness](013-production-deployment.md) | Implemented (backend) | AUTH-07, OPS-01..04 |
| 014 | [Public demo](014-public-demo.md) | Implemented | DEMO-01..06 |
| 015 | [Form and list UX fixes](015-form-and-list-ux.md) | Implemented | MP-10 (UI conventions in the spec) |
| 016 | [Member pending obligations](016-member-pending-obligations.md) | Implemented | MEM-10, DASH-11, DASH-07 |
| 017 | [Pending obligations redesign, list filters and responsive tables](017-pending-obligations-filters-responsive.md) | Implemented | MEM-10, DASH-11, MP-09, UI-01, UI-02, UI-06, TX-01, FIN-06 |
| 018 | [Saving periods](018-saving-periods.md) | Approved | PER-01..08, MP-11, MP-02, MP-04, MP-10, FIN-09, FIN-13 |

Not specified because not implemented: in-app payments, member loan requests/approval workflow, payment reminders beyond the dashboard notice.

## TEMPLATE for a new spec

Copy this into `NNN-short-name.md` (next free number) and fill every section. Delete nothing; write "None" where a section does not apply.

```markdown
# NNN - Feature name

- **Status:** Draft | Approved | Implemented | Changed (date)
- **Owner decision date / reference:** ...
- **Related rules:** FIN-xx, XXX-xx (add new rules to docs/business-rules.md first)

## Problem / goal
Why this exists, in two or three sentences.

## User stories
- As an Admin, I want ..., so that ...
- As a Member, I want ..., so that ...

## Scope
What is included.

## Out of scope
What is explicitly not included (and why / when).

## Business rules
List by ID with a one-line summary. Do not restate full text; link `../business-rules.md`.

## Data model changes
Entities / columns / indexes / migration notes. "None" if no schema change.

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|

## UI
Routes, main sections, differences Admin vs Member, loading/error/empty states, mobile behavior, texts that must match (Spanish UI copy).

## Acceptance criteria
Given / When / Then. One bullet per observable behavior, including failure paths and the audit Log entry for every mutation.

## Test plan
Which rules get unit tests (name the test class), what needs manual validation on the Docker stack.

## Open questions
Anything the owner must decide. Resolved questions move to the rule catalogue.
```
