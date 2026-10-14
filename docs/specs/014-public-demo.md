# 014 - Public demo (read-only replica)

- **Status:** Implemented (2026-10-14)
- **Owner decision date / reference:** 2026-10-14 (read-only replica with fixed fictitious data, no fake backend logic; Admin/Member role selector; "demo mode" banner; frontend only; entering the demo ends a real session; on submit the form closes and an on-screen notice says changes are not saved)
- **Related rules:** DEMO-01..06 (new), UI-03, UI-04, UI-07, MP-09, FIN-09, DASH-*

## Problem / goal
Visitors of the landing page can only read about the app; the real system requires a login and holds real family data. A public, read-only demo lets anyone browse a replica of the system with fictitious data, without an account, without any request to the backend and without duplicating the backend's business rules in the frontend.

## User stories
- As a visitor, I want to open a "Demo" tab from the landing page and browse the system as the Admin, so that I can see how a natillera is managed.
- As a visitor, I want to switch to the Member view, so that I can see what a member sees.
- As the owner, I want the demo to never call the API and to contain no business logic of its own, so that it costs nothing, works while the API is asleep, cannot touch real data and does not diverge from the backend rules.

## Scope
1. **Landing navbar:** a new "Demo" link in the landing `<nav>`, visible at every width, leading to `/demo`.
2. **Demo entry page (`/demo`):** short explanation (fictitious data, read-only) and two choices: "Ver como administrador" and "Ver como miembro".
3. **Demo mode:** after choosing a role, the visitor uses the **same pages and routes** as the real app (dashboard, members, payments, loans, activities, transactions, logs and every detail page). While demo mode is active, the frontend API client answers every read (`GET`) from **static fictitious fixtures** bundled with the frontend instead of calling the API. No login.
4. **Read-only:** create/edit/cancel forms and buttons stay visible so the visitor sees how the system works, but submitting any change (`POST`/`PUT`/`PATCH`/`DELETE`) saves nothing: the form (or confirmation modal) **closes** as after a normal submit, and an on-screen notice (toast) shows "Modo demo: los cambios no se guardan." The data shown does not change, and the pages' own inline success messages are not shown in demo mode (DEMO-04).
5. **Fixtures:** fictitious data already consistent with the real rules: about 6 members, several months of monthly payments (paid, pending and one cancelled), 2 loans with payments and interest, 1 activity with assignments, their Transactions and Logs, and the dashboard summaries (Admin and Member variants) matching those transactions. Dates are expressed relative to the current month when the demo loads, so the data never looks old. The fixtures are data only: the responses are the same shapes the real API returns, and no business rule is recomputed at runtime. Every money figure (balances, summaries, shares) is a literal in the fixtures; at runtime the demo only selects, filters by role (e.g. MP-09) and orders, and the DEMO-06 test recomputes the literals to prove they are consistent.
6. **Member view:** the visitor acts as one fixed fictitious member; the fixtures return what the real API returns to that member (only Paid fees, member dashboard, no Logs) and the UI applies UI-04 as today.
7. **Demo banner:** a fixed banner in every demo screen: "Estás en la demo: los datos son ficticios y no se guarda ningún cambio", the current role, a control to switch role (Admin <-> Member) and "Salir de la demo", which returns to the landing.

## Out of scope
- Interactivity (creating/editing/cancelling with persisted results). If wanted later it is a separate spec (option discussed with the owner: a demo instance of the real API with its own database, via `devops`).
- Any backend change, endpoint or database table.
- Demo of login, password or session-expiry flows.
- Reset button (nothing to reset).

## Business rules
New (see `../business-rules.md`, section DEMO):
- **DEMO-01:** the demo is public at `/demo`, linked from the landing navbar; no login; Admin or Member view.
- **DEMO-02:** in demo mode the frontend sends no request to the backend; reads are answered from bundled fixtures.
- **DEMO-03:** demo data is fictitious and every demo screen shows the demo banner.
- **DEMO-04:** the demo is read-only and has no business logic: write requests save nothing; the form closes and an on-screen notice shows "Modo demo: los cambios no se guardan."
- **DEMO-05:** demo mode and a real session never mix: entering the demo ends any real session in the tab; leaving the demo returns to the landing without a session.
- **DEMO-06:** the fixtures are consistent with the real rules (one non-cancelled Transaction per paid/active entity, balances and dashboard figures equal to the sums of non-cancelled transactions, member responses filtered as MP-09); a unit test checks it.

## Data model changes
None. Browser storage only for the demo session (chosen role), per tab.

## API
None (no backend changes). In demo mode the client serves fixtures for the routes the frontend already reads (`/api/dashboard/summary`, `/api/members[/id[/details]]`, `/api/monthly-payments`, `/api/loans[/id[/payments|interest-payments/id]]`, `/api/activities[/id[/assignments/id]]`, `/api/transactions[/id]`, `/api/logs[/id]`), with the same response contracts as the real API. A route without a fixture answers 404 with the standard "not found" handling.

## UI
- Landing navbar: "Demo" link between "Cómo funciona" and "Quiero unirme"; same style as the other text links but visible on mobile too.
- `/demo` page: brand header, one paragraph, two large buttons (Admin / Member), note "Datos ficticios. Nada de lo que hagas aquí afecta la natillera real."
- Banner: thin bar at the top of `AppShell` in demo mode (brand green tones, not alarming); on 375 px it wraps without horizontal overflow.
- Inside the demo, the logo link to `/` (UI-11) and the sidebar "Salir" button leave the demo like "Salir de la demo" (go to `/`, no session).

## Acceptance criteria
1. **Given** an anonymous visitor on `/`, **when** they click "Demo" in the navbar, **then** `/demo` opens with the Admin / Member choice (desktop and 375 px).
2. **Given** `/demo`, **when** the visitor chooses Admin, **then** the admin dashboard opens with fictitious data and the demo banner, without login.
3. **Given** demo mode, **when** the visitor opens every section and detail page, **then** each one renders with data (no error states) and the network panel shows **no** request to the API URL.
4. **Given** demo mode, **when** the visitor submits any create/edit/cancel form, **then** the form or modal closes, an on-screen notice shows "Modo demo: los cambios no se guardan." and the data shown does not change (no error state, no navigation to a non-existent record).
5. **Given** demo mode, **when** the visitor switches to Member, **then** they see only member screens (no Logs, no admin actions, only Paid fees) for the fixed demo member.
6. **Given** the fixtures, **then** the available money and every balance shown equal the sums of non-cancelled transactions (checked by a unit test).
7. **Given** the demo is opened in any month, **then** the fixture dates are relative to that month (the latest fees belong to the current month).
8. **Given** a real logged-in session in the tab, **when** the visitor enters the demo, **then** the real session ends; **when** they click "Salir de la demo", **then** they land on `/` with no session.
9. `npm test`, `npm run lint` and `npm run build` pass; the real app (non-demo) behaves exactly as before.

## Test plan
- Vitest: fixture consistency (DEMO-06: balances, dashboard, one Transaction per entity, member filtering), demo client routing (DEMO-02: every read route used by the pages has a fixture; `fetch` is never called; writes resolve without saving and emit the demo notice, DEMO-04), relative dates.
- Manual on the Docker dev stack (frontend :3000) with the network panel open: criteria 1-5, 7, 8 at desktop and 375 px.

## Open questions
None. Owner decisions 2026-10-14: entering the demo ends any real session (DEMO-05); write attempts close the form and show an on-screen notice, with the pages' inline success messages hidden in demo mode (DEMO-04); the sidebar "Salir" leaves the demo to `/`; money figures are fixture literals verified by a test (DEMO-06). Not included: the hardcoded "Septiembre 2026" subtitle in the monthly payments page (separate change).
