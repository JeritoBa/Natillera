# AGENTS.md — Natillera Project

This file gives any AI coding agent (Claude Code, Copilot, Cursor, etc.) the context needed to work on this project correctly. Read this before making changes.

---

## 1. What this project is

A **natillera** is an informal community savings/loan group. Today it's managed manually by one person using an iPhone note and a generic money-tracking app. This causes balance inconsistencies and wastes the manager's time.

**Goal:** build an application dedicated to natillera management, where the admin registers transactions and everyone can see the balance — with **data integrity and consistency as the core value**, not just a feature.

**Primary users (in order):**
1. The natillera **admin/manager** (short term)
2. The **members** of the natillera (short term, right after admin flows exist)

---

## 2. Non-negotiable principle

> **Financial data integrity and consistency come before speed, features, or convenience.**

Any agent working on this codebase should treat this as the top-priority constraint when in doubt. Concretely:

- Money is **never** represented with floating-point types (use `decimal` in C#).
- Every transaction/operation must have a controlled type/direction.
- A loan payment can never exceed the outstanding loan balance.
- Financial operations must be **traceable** (who did what, when) — see Audit/Log below.
- Financial records are **never silently deleted** (soft delete / immutability where applicable).
- The **balance is always derived from authoritative transaction records** — it is never a manually maintained or independently editable number. There is one source of truth.

---

## 3. Architecture decisions (already made — do not relitigate without strong reason)

| Area | Decision | Why |
|---|---|---|
| Overall architecture | **Modular monolith** (not microservices) | Expected scale is small (~100 active users max). Microservices' operational complexity isn't justified. Modules should still be logically separated (domain / application / infrastructure / presentation) to allow future extraction. |
| Backend architecture | **Clean Architecture** | Business rules (financial integrity) are the most important part of the system. Clean Architecture minimizes coupling between core business logic and infrastructure, at the cost of more upfront structure. |
| Backend language/framework | **C# with ASP.NET Core**, EF Core, ASP.NET Identity | Strong static typing, good performance, security, and maintainability for a business/financial app. Trade-off accepted: more verbose than Node/Python. |
| Frontend framework | **React** | Needed for an interactive SPA with dynamic UI, reusable components, and client-side state. Trade-off accepted: more complexity than a simpler UI approach. |
| Frontend↔Backend communication | **REST API** | Frontend has a clear, resource-oriented need (CRUD-like operations). Trade-off accepted vs GraphQL: possibly more requests/over-fetching, deemed acceptable at current scope. |
| Database | **PostgreSQL** | Transactional/relational system where data integrity > schema flexibility. Also open-source licensing. (Note: dev plan mentions SQL Server as a still-open alternative — treat Postgres as the working assumption unless told otherwise.) |
| Deployment (planned) | Docker & Docker Compose locally; target hosting Vercel (free tier) — **not finalized**, revisit before Week 8 (Hardening & Deployment). |
| Versioning | Git | — |

---

## 4. Data model

Core entities:

`User`, `Transaction`, `MonthlyPayment`, `Loan`, `Performance`, `LoanPayment`, `Activity`, `ActivitySale`, `ActivityAssignment`, `Log`

- The ER diagram currently only exists on paper — **digitizing it is a pending task** (Section 3.2 of the dev plan). Don't assume relationships/cardinalities beyond what's stated here; confirm with the project owner if a story requires an undefined relationship.
- `Log` exists specifically to support audit/traceability requirements (US-05).
- `Transaction` is the backbone financial record; `MonthlyPayment` and other financial actions should produce/link to `Transaction` records rather than existing independently.

---

## 5. Scope: MVP vs Post-MVP

### MVP (build this first, in this order — see dependency graph in Section 7)
**Shared**
- Login (admin/member)

**Admin**
- Manage a member
- Manage a monthly payment
- View members in debt
- View audit history of a financial operation

**Member**
- View current natillera balance
- View all transactions
- View saved money + performances *(⚠️ see note below)*
- Be reminded of pending payments

### Explicitly Post-MVP (do not implement unless asked)
- Loans: admin manage loans/loan payments, member request loan, approval workflow, loan status view
- Performances: admin manage, member view
- Activities: admin manage activities/sales/assignments, member view, seller ranking
- **In-app payments** (member pays from the app) — flagged as a **separate integration project** due to external payment provider + security/reconciliation requirements. Treat as high-risk/out-of-scope by default.

---

## 6. Development workflow (apply to every user story)

```
User Story → Acceptance Criteria → Dependencies → Backend/Domain →
DB changes (if needed) → API → Frontend → Integration → Tests →
Verification → Git Commit → Done
```

Key rule: **"the endpoint exists" ≠ "the story is done."** A story is done when the user can actually perform the action and the relevant business rules are verified (see Definition of Done below).

**Board discipline:** max **one** major user story "In Progress" at a time (solo developer — avoid context switching).

---

## 7. Definition of Done (apply to every story before marking complete)

- **Domain:** business rules defined; domain model correct
- **Backend:** use case, validation, authorization, API, error handling implemented
- **Database:** schema changes implemented, migration created and tested
- **Frontend:** UI implemented, API integrated, loading/error/success states handled
- **Testing:** happy path, important failure paths, and business rules tested
- **Final:** works end-to-end, committed, docs updated if needed

---

## 8. MVP user stories & dependency order

1. **US-01 Login** → M1 Authentication
2. **US-02 Manage member** → M2 Member management
3. **US-03 Manage monthly payment** (first real financial transaction flow) → M3 Monthly payments
4. **US-04 View members in debt** (depends on US-03) → M4 Debt monitoring
5. **US-05 Audit history** (depends on Log + financial entities) → M5 Traceability
6. **US-06 View natillera balance** (depends on US-03; balance must derive from Transaction, never a stored/edited number) → M6 Balance
7. **US-07 View all transactions** (depends on US-06) → M7 Transparency
8. **US-08 View saved money + performances** — ⚠️ blocked, see Section 5 note
9. **US-09 Pending payment reminders** (depends on US-03 + debt rules) → M8 Member financial awareness

Global dependency chain: `Initial Setup → Data Model → Authentication → Member Management → Monthly Payments → {Debt Detection, Balance} → Transactions → Audit` (Testing infrastructure can run in parallel with Data Model).

---

## 9. Current phase (as of the plan's timeline)

The plan targets an **8-week MVP** at ~10–15 focused dev hours/week, structured as milestones **M0 → M8**:

```
M0 Foundation → M1 Auth → M2 Members → M3 Monthly Payments →
M4 Financial Visibility → M5 Transparency & Audit →
M6 MVP User Experience → M7 MVP Hardening → M8 Production Release
(then Post-MVP: M9 Loans → M10 Performances → M11 Activities → M12 Payments)
```

**Scheduled milestone dates (reference — confirm actual status with the project owner/board before assuming a phase is complete):**

| Milestone | Window | Deliverables |
|---|---|---|
| M0 — Foundation | Sep 14–16 | Repo, solution structure, Docker, Postgres, ASP.NET, React setup, EF Core, DbContext, initial models/migration |
| M1 — Authentication | Sep 17–19 | Identity, roles, login, authorization, protected routes, tests |
| M2 — Member Management | Sep 21–23 | Member CRUD, validation, UI, integration, tests |
| M3 — Monthly Payments | Sep 24–26 | Payment workflow, transaction creation, financial validation, UI, tests |
| M4 — Debt + Balance | Sep 28–30 | Debt & balance calculation, views, tests |
| M5 — Transactions + Audit | Oct 1–3 | Transaction history, audit mechanism/UI, authorization, tests |
| M6 — Member Dashboard | Oct 5–7 | Balance, transactions, pending payments, summary UI |
| M7 — Hardening & Deployment | Oct 8–10 | Integration/financial/auth testing, error handling, backup strategy, prod config, deployment, docs |

**Do not assume progress beyond what's confirmed in the repo/board.** The project's own tracking board (Backlog / Ready / In Progress / Testing / Done) is the source of truth for actual status — this file only encodes the *plan*.

**Foundation checklist (M0 — verify against repo before treating as complete):**
- [ ] Git repository, branching strategy, `.gitignore`, README
- [ ] Environment variables + `.env.example`, local dev instructions documented
- [ ] Docker + Docker Compose configured
- [ ] PostgreSQL, ASP.NET project, React project configured
- [ ] Test projects configured
- [ ] EF Core + DbContext registered via DI
- [ ] Initial domain entities + first migration applied and verified

---

## 10. Weekly review questions (useful for status/PR summaries)

When summarizing progress, an agent can frame it using these four questions from the plan:
1. **Product:** What can a real user do now that they couldn't do last week?
2. **Technical:** What technical debt or blocker was introduced?
3. **Quality:** What financial/business rule is still insufficiently tested?
4. **Planning:** What is the single most important deliverable for next week?

---

## 11. Guidance for agents working in this repo

- **Verify before assuming:** check the actual repo state (files, migrations, tests) rather than trusting this document's checklists as current status — this file describes the plan, not necessarily what's implemented today.
- **Don't build Post-MVP features** (Loans, Performances, Activities, In-app Payments) unless explicitly asked, even if they'd be "easy" while touching related code.
- **Respect Clean Architecture boundaries:** domain/business logic must not depend on infrastructure (EF Core, ASP.NET specifics) — dependencies point inward.
- **Money = `decimal`, never `float`/`double`.**
- **Every financial mutation should be traceable** — think about how it will show up in the audit log before implementing it.
- **Balance/derived values are computed, not stored-and-edited.** If a feature seems to need editing a balance directly, that's a red flag — stop and clarify.
- **One story in progress at a time** — don't parallelize unrelated MVP stories unless explicitly asked.
- If a request maps to a **Post-MVP or explicitly blocked** story (like US-08), say so and propose the recommended resolution (Option A: defer) rather than quietly implementing a workaround.