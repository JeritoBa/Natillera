# 009 - Landing page and login UI

- **Status:** Implemented
- **Related rules:** UI-07, AUTH-03, AUTH-04

## Problem / goal
Visitors understand what the natillera is and how to join; members and the Admin reach the login easily. The brand identity is consistent across the app.

## User stories
- As a visitor, I want to understand what a natillera is and how a month works.
- As a visitor, I want to contact the natillera to join.
- As a member, I want a clear login screen with understandable errors.

## Scope
Public landing at `/`, login page at `/login`, visual identity.

## Out of scope
Self-registration (joining is done by contacting the Admin via WhatsApp), public real data, SEO beyond basic metadata.

## Business rules
UI-07 (public, no real data, examples labeled as fictitious), AUTH-03/AUTH-04 (login messages).

## Data model changes
None.

## API
None (static content; login uses `POST /api/auth/login`, see spec 001).

## UI
- Visual identity: green `#0c5c38`; fonts Outfit (headings), Inter (body), JetBrains Mono (figures); "ledger notebook" aesthetic; snout logo from `public/logo-gallego-nanclares.png` (an inverted white version for green backgrounds); original design files in `Natillera.Frontend/design/`.
- Landing sections: hero, "¿Qué es una natillera?", "Así funciona un mes en la natillera", "Lo que ves cuando entras" (member preview with **fictitious** example figures, always labeled), "Lo que ganas, y lo que te pedimos", and a final call to action "¿Quieres entrar a la natillera?" linking to WhatsApp (`https://wa.me/573123326094?text=Quiero%20unirme%20a%20la%20natillera`) and to the login.
- Login: see spec 001; the brand logo appears in the header.
- Authenticated users visiting `/login` go to `/dashboard`.

## Acceptance criteria
- **Given** an anonymous visitor, **when** opening `/`, **then** the landing renders without calling authenticated endpoints and shows no real financial data.
- **Given** any example figure on the landing, **then** it is visibly labeled as fictitious.
- **Given** the join button, **then** it opens WhatsApp with the pre-filled message (covered by `contact.test.ts`).
- **Given** the page at 375 px width, **then** there is no horizontal overflow.

## Test plan
Unit: `shared/lib/contact.test.ts`. Manual: screenshots at desktop and 375 px on the Docker stack.

## Open questions
None.
