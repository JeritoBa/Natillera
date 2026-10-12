# 002 - Members

- **Status:** Implemented
- **Related rules:** MEM-01 .. MEM-09, AUTH-01, DASH-09

## Problem / goal
The Admin maintains the list of people in the natillera and can see each member's financial situation.

## User stories
- As an Admin, I want to create, edit, activate and deactivate members.
- As an Admin, I want a member detail page with savings, pending fees and transaction history.
- As a Member, I want to see the list of members of the natillera (read-only).

## Scope
Member CRUD (no delete), activation/deactivation with obligation check, member detail (admin only), default initial password.

## Out of scope
Physical deletion, password management, member self-service profile, audit log of member changes (see open questions).

## Business rules
MEM-01 .. MEM-09; the detail balance follows DASH-04/DASH-06/DASH-09.

## Data model changes
None (`User`: names <= 45, email <= 100 unique, phone <= 10, role, `IsActive`, `CreatedAt`, `UpdatedAt`).

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| GET | `/api/members` | Any authenticated | - | 200 list of members (role Member only), ordered by last then first name |
| GET | `/api/members/{id}/details` | Admin | - | 200 `{ member, balance{savings, activityEarnings, performanceEarnings, total}, pendingPayments[], transactions[] }`; 404 |
| POST | `/api/members` | Admin | `{ firstName, lastName, email, phone }` | 201 member; 400; 409 duplicate email |
| PUT | `/api/members/{id}` | Admin | `{ firstName, lastName, email, phone }` | 200 member; 400; 409 duplicate email |
| PATCH | `/api/members/{id}/status` | Admin | `{ isActive }` | 200 member; 400 with pending-obligations message |

## UI
- `/members`: table (name, email, phone, status badge); on mobile only name (link to detail) + status, secondary data in a small line. Admin sees create/edit and Activar/Desactivar actions and the "Ver detalle" link (hidden on mobile; the name links to the detail). Member sees the list only.
- `/members/:id` (Admin): headline block with the member's total balance and breakdown (savings, activity earnings, interest share), pending fees, transaction history, details section; loading / 404 / error-with-retry states.
- Backend errors (for example the deactivation block listing pending counts) are shown as-is.

## Acceptance criteria
- **Given** a new unique email, **when** the Admin creates a member, **then** the member is active, has the default initial password, and appears in the list.
- **Given** an existing email, **when** creating or editing, **then** the request is rejected (409) with "A user with this email already exists.".
- **Given** a member with pending fees / active loans / pending interest / pending assignments, **when** the Admin deactivates them, **then** the request fails and the message lists the counts per kind.
- **Given** a member with no pending obligations, **when** deactivated, **then** `isActive` becomes false and their sessions stop working (spec 001).
- **Given** an inactive member, **when** activated, **then** they can log in again.
- **Given** the admin account id, **when** edited or deactivated through `/api/members`, **then** the API answers "Member not found.".
- **Given** a Member, **when** they open `/members/:id`, **then** they are redirected (and the API answers 403).

## Test plan
Unit: `UserServiceSetMemberStatusTests` / `MemberDetailServiceTests` in `Application/UserMemberAuthServiceTests.cs`, `UserTests`. Manual: member lifecycle on the Docker stack with "QA ..." members.

## Open questions
- Should member create/update/status changes be audited (MEM-08)?
