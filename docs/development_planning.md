# Natillera — Development Plan

## 1. Development Strategy

The application will be developed incrementally, prioritizing the **integrity and consistency of financial information**.

Development will follow this principle:

> **Every completed development cycle must leave the application in a working state.**

The project will be divided into:

1. Initial Setup
2. Data Model Foundation
3. Authentication
4. MVP User Stories
5. MVP Testing & Hardening
6. Deployment
7. Post-MVP Features

The application will be developed as a **modular monolith**, with clear separation between domain/business logic, application/use cases, infrastructure, and presentation.

The initial architecture should remain simple enough for an individual developer while preserving the possibility of future growth.

---

# 2. Initial Setup

## 2.1 Repository and Development Environment

### Tasks

* [ ] Create Git repository
* [ ] Define branching strategy
* [ ] Create `.gitignore`
* [ ] Create README
* [ ] Define environment variables
* [ ] Create `.env.example`
* [ ] Define local development instructions
* [ ] Configure Docker
* [ ] Configure Docker Compose
* [ ] Configure PostgreSQL
* [ ] Configure React project
* [ ] Configure ASP.NET project
* [ ] Configure test projects

### Expected result

The entire development environment can be started from a clean machine with documented commands.

### Definition of Done

```text
Docker Compose
      ↓
PostgreSQL
      ↓
ASP.NET
      ↓
React
      ↓
All applications start successfully
```

---

# 3. Data Model Foundation

Because the ER model has already been designed conceptually, the core data model should be implemented **before developing the user stories**.

## 3.1 Core Models

Initial models:

* User
* Transaction
* MonthlyPayment
* Loan
* Performance
* LoanPayment
* Activity
* ActivityAssignment
* Log

## 3.2 Tasks

* [ ] Transfer paper ER diagram to digital ER diagram
* [ ] Validate cardinalities
* [ ] Validate required/optional relationships
* [ ] Define primary keys
* [ ] Define foreign keys
* [ ] Define unique constraints
* [ ] Define monetary data types
* [ ] Define indexes
* [ ] Define deletion behavior
* [ ] Define concurrency considerations
* [ ] Create domain entities
* [ ] Configure EF Core mappings
* [ ] Configure `DbContext`
* [ ] Register `DbContext` through dependency injection
* [ ] Configure PostgreSQL
* [ ] Create initial migration
* [ ] Apply migration
* [ ] Verify generated database schema

## 3.3 Financial Integrity Rules

Before implementing financial user stories, define the rules governing money.

Examples:

```text
Money must never be represented using floating-point types.

Transactions must have a controlled type/direction.

A loan payment cannot exceed the outstanding loan balance.

A monthly payment must belong to a valid member.

A financial operation must be traceable.

Financial records must not be silently deleted.

Balance calculations must derive from authoritative financial records.
```

These rules should be treated as **business requirements**, not merely database implementation details.

### Definition of Done

```text
ER Diagram
    ↓
EF Core Models
    ↓
DbContext
    ↓
Migration
    ↓
PostgreSQL Schema
    ↓
Database successfully queried from ASP.NET
```

---

# 4. Authentication Foundation

Authentication is a dependency for every protected user story.

## Tasks

* [ ] Configure ASP.NET Identity
* [ ] Configure User entity
* [ ] Configure password management
* [ ] Configure authentication
* [ ] Configure authorization
* [ ] Define Admin role
* [ ] Define Member role
* [ ] Configure JWT/cookie strategy according to deployment architecture
* [ ] Implement login
* [ ] Implement authentication validation
* [ ] Implement authorization policies
* [ ] Test invalid credentials
* [ ] Test unauthorized access
* [ ] Test role restrictions

### Definition of Done

```text
Admin
   ↓
Login
   ↓
Authenticated session
   ↓
Can access Admin resources

Member
   ↓
Login
   ↓
Authenticated session
   ↓
Can access Member resources
```

---

# 5. Development Workflow for User Stories

Every user story follows the same cycle:

```text
User Story
    ↓
Acceptance Criteria
    ↓
Dependencies
    ↓
Backend / Domain
    ↓
Database changes if necessary
    ↓
API
    ↓
Frontend
    ↓
Integration
    ↓
Tests
    ↓
Verification
    ↓
Git Commit
    ↓
Done
```

A story is **not complete because the endpoint exists**.

It is complete when the user can perform the intended action successfully and the important business rules have been verified.

---

# 6. MVP User Stories

## US-01 — Login

**As an admin/member, I want to login into the system so that I can have access to the information.**

### Dependencies

* Initial setup
* User model
* Identity
* Roles
* Authentication configuration

### Tasks

* [ ] Login API
* [ ] Authentication validation
* [ ] Role authorization
* [ ] Login page
* [ ] Connect frontend to API
* [ ] Authentication state
* [ ] Protected routes
* [ ] Invalid-login handling
* [ ] Tests

### Milestone

**M1 — Authentication working**

---

# 7. Admin — Manage Members

## US-02

**As an admin, I want to manage a new member so that I can keep track of the income received from each customer.**

### Dependencies

* US-01
* User model
* Authorization
* Database

### Tasks

* [ ] Define member creation rules
* [ ] Create member API
* [ ] Implement validation
* [ ] Implement member retrieval
* [ ] Implement member update
* [ ] Determine whether deletion is permitted
* [ ] Create member UI
* [ ] Create member list
* [ ] Integrate frontend/API
* [ ] Tests

### Milestone

**M2 — Member management working**

---

# 8. Admin — Manage Monthly Payments

## US-03

**As an admin, I want to manage a new monthly payment so that I can create a register of his money.**

### Dependencies

* US-02
* User/Member
* Transaction
* MonthlyPayment

### Tasks

* [ ] Define monthly payment rules
* [ ] Define duplicate-payment rules
* [ ] Implement monthly payment creation
* [ ] Create corresponding transaction
* [ ] Validate member
* [ ] Validate year/month
* [ ] Validate amount
* [ ] Implement retrieval
* [ ] Implement UI
* [ ] Integrate API
* [ ] Test financial rules
* [ ] Test duplicate scenarios

### Important

This story should establish the application's first **real financial transaction flow**.

### Milestone

**M3 — Monthly payment system working**

---

# 9. Admin — Debt Management

## US-04

**As an admin, I want to see the members who are in debt so that I can be aware of them.**

### Dependencies

* US-03
* MonthlyPayment
* Member
* Business rules for determining debt

### Tasks

* [ ] Define exactly what "in debt" means
* [ ] Implement debt calculation
* [ ] Create API endpoint
* [ ] Create debt view
* [ ] Add filtering/sorting if required
* [ ] Test different debt scenarios

### Milestone

**M4 — Debt monitoring working**

---

# 10. Admin — Audit History

## US-05

**As an admin, I want to view the audit history of a financial operation so that I can trace who created or modified it.**

### Dependencies

* Authentication
* User
* Financial entities
* Log
* Transaction architecture

### Tasks

* [ ] Define auditable operations
* [ ] Define audit information
* [ ] Define Log model
* [ ] Record actor/user
* [ ] Record operation
* [ ] Record affected entity
* [ ] Record timestamp
* [ ] Record relevant before/after information
* [ ] Implement audit mechanism
* [ ] Implement audit API
* [ ] Create audit UI
* [ ] Test audit generation
* [ ] Test unauthorized access

### Milestone

**M5 — Financial traceability working**

---

# 11. Member — View Current Natillera Balance

## US-06

**As a member, I want to see the actual natillera balance so that I can have full transparency with the transactions.**

### Dependencies

* US-03
* Transaction model
* Financial calculation rules

### Tasks

* [ ] Define authoritative balance calculation
* [ ] Define transaction inclusion rules
* [ ] Implement balance calculation
* [ ] Create balance API
* [ ] Create member balance view
* [ ] Test positive balance
* [ ] Test multiple transactions
* [ ] Test edge cases

### Important

The balance should not become a manually maintained number that can drift away from the transactions.

The system should have a clearly defined **source of truth**.

### Milestone

**M6 — Balance visibility working**

---

# 12. Member — View Transactions

## US-07

**As a member, I want to see all the transactions of the natillera so that I can have full transparency.**

### Dependencies

* US-06
* Transaction
* Authentication

### Tasks

* [ ] Create transaction query
* [ ] Define member visibility rules
* [ ] Implement pagination
* [ ] Implement filtering if required
* [ ] Create transaction API
* [ ] Create transaction UI
* [ ] Tests

### Milestone

**M7 — Transaction transparency working**

---

# 13. Member — View Saved Money and Performances

## US-08

**As a member, I want to see my saved money together with my performances so that I can be aware of it.**

### Dependencies

* User
* Transaction
* Performance
* Financial calculation rules

### Important dependency

Your current MVP includes this story, but **Performance does not currently have an MVP admin story that creates it**.

Therefore, you have two options:

### Option A — Recommended

Move this story out of the MVP until the performance functionality exists.

```text
Loan
 ↓
Performance
 ↓
Member financial summary
```

### Option B

Define a simplified performance calculation as part of the MVP.

I recommend **Option A** unless the performance calculation is already completely defined.

---

# 14. Member — Pending Payment Reminders

## US-09

**As a member, I want to be remembered of my pending payments so that I can take them into account.**

### Dependencies

* US-03
* Debt rules
* Member
* MonthlyPayment

### Tasks

* [ ] Define pending-payment rules
* [ ] Calculate pending payments
* [ ] Create pending-payment API
* [ ] Display pending payments
* [ ] Test payment states

### Milestone

**M8 — Member financial awareness working**

---

# 15. MVP Completion

The MVP is complete when:

```text
                    NATILLERA MVP
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
      Authentication   Admin         Member
          │              │              │
          │        ┌─────┼─────┐    ┌────┼────┐
          │        ↓     ↓     ↓    ↓    ↓    ↓
          │      Users Payments Debt Balance Tx History
          │              │       │      │
          └──────────────┴───────┴──────┴──────┘
                         ↓
                   AUDITABILITY
                         ↓
                  FINANCIAL INTEGRITY
```

---

# 16. Post-MVP User Stories

These should **not** interfere with the MVP.

## Loans

* [ ] Admin manages loans
* [ ] Admin manages loan payments
* [ ] Member requests a loan
* [ ] Loan approval workflow
* [ ] Member views loan status

## Performances

* [ ] Admin manages performances
* [ ] Member views performances

## Activities

* [ ] Admin manages activities
* [ ] Admin registers activity sales/income
* [ ] Admin manages activity assignments
* [ ] Members view activity information
* [ ] Seller ranking

## Payments

* [ ] Member pays from application

The last one should be considered a separate integration project because it introduces an external payment provider and additional security/reconciliation requirements.

---

# 17. Dependencies

## Global dependency graph

```text
Initial Setup
     │
     ├──────────────┐
     ↓              ↓
Data Model       Testing Infrastructure
     │
     ↓
Authentication
     │
     ↓
Member Management
     │
     ↓
Monthly Payments
     │
     ├───────────────┐
     ↓               ↓
Debt Detection    Balance
     │               │
     └───────┬───────┘
             ↓
       Transactions
             │
             ↓
          Audit
```

Some dependencies can be developed in parallel.

For example:

```text
Data Model
    ├── Backend foundation
    ├── Frontend foundation
    └── Test infrastructure
```

However, **business user stories should follow their actual domain dependencies**.

---

# 18. Development Deadlines

Assuming approximately **10–15 focused development hours per week**, I would use an 8-week MVP target rather than trying to create an aggressive schedule.

## Moment 1 — Foundation 

September 14 - September 16

### Deadline

September 16

### Deliverables

* [ ] Repository
* [ ] Solution structure
* [ ] Docker
* [ ] PostgreSQL
* [ ] ASP.NET
* [ ] React
* [ ] Configuration
* [ ] EF Core
* [ ] DbContext
* [ ] Initial domain models
* [ ] Initial migration
* [ ] Database working

**Milestone: Development-ready project**

---

## Week 2 — Authentication

September 17 - September 19

### Deadline

September 19

### Deliverables

* [ ] Identity
* [ ] Roles
* [ ] Login
* [ ] Authorization
* [ ] Protected frontend routes
* [ ] Authentication tests

**Milestone: M1 — Authentication**

---

## Week 3 — Members

September 21 - September 23

### Deadline

September 23

### Deliverables

* [ ] Member management
* [ ] CRUD operations required by the MVP
* [ ] Validation
* [ ] UI
* [ ] Integration
* [ ] Tests

**Milestone: M2 — Member Management**

---

## Week 4 — Monthly Payments

September 24 - September 26

### Deadline

September 26

### Deliverables

* [ ] Monthly payment workflow
* [ ] Transaction creation
* [ ] Financial validation
* [ ] UI
* [ ] Integration
* [ ] Tests

**Milestone: M3 — Monthly Payments**

---

## Week 5 — Debt + Balance

September 28 - September 30

### Deadline

September 30

### Deliverables

* [ ] Debt calculation
* [ ] Balance calculation
* [ ] Member balance view
* [ ] Debt view
* [ ] Tests

**Milestone: M4 — Financial Visibility**

---

## Week 6 — Transactions + Audit

Octuber 1 - Octuber 3

### Deadline

Octuber 3

### Deliverables

* [ ] Transaction history
* [ ] Audit mechanism
* [ ] Audit history
* [ ] Authorization
* [ ] Tests

**Milestone: M5 — Transparency & Traceability**

---

## Week 7 — Member Dashboard

Octuber 5 - Octuber 7 

### Deadline

Octuber 7

### Deliverables

* [ ] Member dashboard
* [ ] Balance
* [ ] Transactions
* [ ] Pending payments
* [ ] Financial summary
* [ ] UI refinement
* [ ] Integration tests

**Milestone: M6 — MVP User Experience**

---

## Week 8 — Hardening & Deployment

Octuber 8 - Octuber 10

### Deadline

Octuber 10

### Deliverables

* [ ] Integration testing
* [ ] Financial integrity testing
* [ ] Authorization testing
* [ ] Error handling
* [ ] Database backup strategy
* [ ] Production configuration
* [ ] Deployment
* [ ] Production smoke tests
* [ ] Documentation

**Milestone: MVP Release**

---

# 19. Definition of Done

A user story is only considered **DONE** when:

### Domain

* [ ] Business rules are defined
* [ ] Domain model is correct

### Backend

* [ ] Use case implemented
* [ ] Validation implemented
* [ ] Authorization implemented
* [ ] API implemented
* [ ] Error handling implemented

### Database

* [ ] Database changes implemented
* [ ] Migration created
* [ ] Migration tested

### Frontend

* [ ] UI implemented
* [ ] API integrated
* [ ] Loading state handled
* [ ] Error state handled
* [ ] Success state handled

### Testing

* [ ] Happy path tested
* [ ] Important failure paths tested
* [ ] Business rules tested

### Final

* [ ] Feature works end-to-end
* [ ] Code committed
* [ ] Documentation updated if necessary

---

# 20. Progress Tracking

Use one board:

| Backlog             | Ready           | In Progress | Testing | Done |
| ------------------- | --------------- | ----------- | ------- | ---- |
| Loan                | Login           | —           | —       | —    |
| Performance         | Members         | —           | —       | —    |
| Activities          | Monthly Payment | —           | —       | —    |
| Payment Integration | Balance         | —           | —       | —    |

### Rule

**Maximum 1 major user story in "In Progress".**

As an individual developer, context switching will hurt your progress much more than having a slightly imperfect task order.

---

# 21. Weekly Review

At the end of every week, answer:

### Product

> What can a real user do now that they couldn't do last week?

### Technical

> What technical debt or blocker was introduced?

### Quality

> What financial/business rule is still insufficiently tested?

### Planning

> What is the single most important deliverable for next week?

This keeps the project moving toward the actual objective rather than toward an arbitrary percentage of completed tasks.

---

# 22. Recommended Project Milestones

```text
M0 ─ Development Foundation
 │
 ↓
M1 ─ Authentication
 │
 ↓
M2 ─ Member Management
 │
 ↓
M3 ─ Monthly Payments
 │
 ↓
M4 ─ Financial Visibility
 │
 ↓
M5 ─ Transparency & Audit
 │
 ↓
M6 ─ MVP User Experience
 │
 ↓
M7 ─ MVP Hardening
 │
 ↓
M8 ─ Production Release
 │
 ↓
M9 ─ Loans
 │
 ↓
M10 ─ Performances
 │
 ↓
M11 ─ Activities
 │
 ↓
M12 ─ Payments / External Integrations
```

The first objective is therefore **not "finish the application."**

It is:

> **Reach M0, then repeatedly turn one user story into a tested, working vertical slice until M8.**

That gives you a measurable development process while keeping the architecture and database under control.
