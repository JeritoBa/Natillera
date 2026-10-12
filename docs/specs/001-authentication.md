# 001 - Authentication

- **Status:** Implemented
- **Related rules:** AUTH-01 .. AUTH-07, MEM-06

## Problem / goal
Only known people can enter the system, with the right level of access (Admin manages, Member reads), and a deactivated person loses access immediately.

## User stories
- As an Admin or Member, I want to sign in with my email and password so I can use the application.
- As an Admin, I want a deactivated member to lose access right away, even with an open session.

## Scope
- Email/password login returning a JWT and the user profile.
- Role-based authorization (`Admin`, `Member`) on all endpoints except login.
- Per-request check that the user is still active.
- Frontend session handling: token storage, automatic logout on expiry or 401, protected routes, admin-only routes.
- Admin account seeding from environment variables (Development only).

## Out of scope
Self-registration, password reset/change, refresh tokens, multi-factor authentication. Members are created by the Admin (spec 002).

## Business rules
AUTH-01 (roles), AUTH-02 (generic login error), AUTH-03 (inactive cannot log in), AUTH-04 (token revoked on deactivation), AUTH-05 (JWT config validated), AUTH-06 (BCrypt, password length), AUTH-07 (seeding/migrations only in Development).

## Data model changes
None (uses `User`: `Role` Member|Admin, `IsActive`, `PasswordHash`).

## API
| Verb | Route | Role | Request | Response / errors |
|---|---|---|---|---|
| POST | `/api/auth/login` | Anonymous | `{ email, password }` | 200 `{ accessToken, expiresAt, user }`; 401 `{ message }` ("Invalid email or password." / "The user is inactive." / "Email and password are required.") |
| POST | `/api/users` | Admin | `{ firstName, lastName, email, password, phone, role }` | 201 user; 400 validation; 409 duplicate email |

Every other endpoint requires `Authorization: Bearer <jwt>`; 401 when the token is invalid or the user is inactive/missing, 403 when the role is insufficient.

## UI
- `/login`: email + password form with show/hide password. Authenticated users are redirected to `/dashboard`.
- Messages (Spanish): inactive -> "Tu cuenta está desactivada. Contacta al administrador."; revoked session -> "Tu sesión ya no es válida. Inicia sesión de nuevo."; wrong credentials -> credentials message; 403 -> permissions message; network failure and timeout have their own messages.
- `ProtectedRoute` wraps all `/dashboard`, `/members`, `/loans`, `/activities`, `/payments`, `/transactions`, `/logs` routes; `AdminRoute` additionally wraps `/members/:id`, `/logs`, `/logs/:id`. Unknown paths redirect to `/`.
- The session expires client-side at the token expiry time.

## Acceptance criteria
- **Given** an active user with valid credentials, **when** they log in, **then** they receive a token and land on `/dashboard`.
- **Given** a wrong password or unknown email, **when** logging in, **then** the same generic error is shown (no account enumeration).
- **Given** an inactive user with the correct password, **when** logging in, **then** login fails with the inactive message; **given** the wrong password, **then** the generic error (inactivity not revealed).
- **Given** a logged-in member who is deactivated by the Admin, **when** they make any request, **then** the API answers 401, the frontend logs them out and shows the "sesión ya no es válida" notice.
- **Given** a Member, **when** they call a mutation endpoint or open `/logs` or `/members/:id`, **then** the API answers 403 / the UI redirects.
- **Given** `JWT_SECRET` shorter than 32 bytes, **when** the API starts, **then** it fails to start.

## Test plan
Unit: `AuthenticationServiceTests` (login paths). Manual on the Docker stack: deactivate a "QA ..." member with an open session and verify the 401 -> logout flow; role checks (403) on mutation endpoints. No automated test for the JWT middleware (integration tests pending).

## Open questions
- Password change/reset flow for members (not requested yet).
- Production strategy for admin seeding (currently Development only).
