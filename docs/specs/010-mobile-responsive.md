# 010 - Mobile responsive layout

- **Status:** Implemented
- **Related rules:** UI-04, UI-05, UI-06

## Problem / goal
Most members check the natillera from a phone; every authenticated screen must be usable at 375 px width.

## User stories
- As a Member on a phone, I want to read lists, details and my balances without horizontal scrolling.
- As the Admin on a phone, I want to register payments and open details with comfortable touch targets.

## Scope
Responsive behavior of the app shell, list tables, detail pages and modals (Tailwind breakpoints; `sm` = tablet/desktop).

## Out of scope
A native app/PWA install, offline mode, dedicated tablet layouts.

## Business rules
UI-06 (tables on mobile), UI-05 (detail page pattern), UI-04 (role-based UI).

## Data model changes / API
None.

## UI
- App shell: the sidebar becomes an off-canvas drawer below the `lg` breakpoint, with a dimmed overlay.
- List tables at 375 px show: the main cell (a link to the detail), the amount, and the actions; secondary data (status, dates, email, phone) goes in a small line under the main cell. The "eye"/"Ver detalle" button is hidden on mobile because the main cell is the link.
- Action buttons have at least a 40 px touch target on mobile.
- Detail pages stack the headline block, breakdown `<dl>` and cards in one column.
- Modals are centered over a dimmed overlay (no explicit max-height/scroll handling in `shared/ui/Modal.tsx`; long forms on very small screens are unverified).

## Acceptance criteria
- **Given** a 375 px viewport, **when** opening each list (`/members`, `/payments`, `/loans`, `/activities`, `/transactions`, `/logs`), **then** no horizontal scroll appears and the amount and actions are visible.
- **Given** a 375 px viewport, **when** tapping the main cell of a row, **then** the detail page opens.
- **Given** the Admin on mobile, **when** opening a create/edit modal, **then** all fields and buttons are reachable.

## Test plan
No automated test (visual). Validate with screenshots on the Docker stack (frontend :3000) at 375 px and desktop; follow the ux-designer workflow.

## Open questions
None.
