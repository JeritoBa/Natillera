# 015 - Form and list UX fixes (v1.0.1)

- **Status:** Implemented (2026-10-14)
- **Owner decision date / reference:** 2026-10-14 (owner request for v1.0.1; ux-designer analysis; decisions: the existing year field stays exactly as it is (free number input, default current year); the month select offers the months of the entered year minus taken ones, including future months; taken months are hidden; loans month filter = existing start-month filter; business-rules.md holds only business logic, so the UI conventions of this spec live here)
- **Related rules:** MP-10 (new), MP-04, MEM-01, UI-03, UI-04, UI-05, UI-06

## Problem / goal
Create/edit modals do not submit with Enter, some errors appear behind the modal (Members hides the backend message), the monthly payment form offers months the member already paid, and the Members and Loans lists cannot be searched. The Loans table clips or squeezes its actions on mobile and tablet widths.

## User stories
- As an Admin, I want to press Enter to save a form, so that data entry is faster.
- As an Admin, I want create/edit errors inside the form I am filling, so that I see them and keep what I typed.
- As an Admin, I want the fee form to offer only the months the member is missing, so that I do not try to register a duplicate fee.
- As an Admin or Member, I want to search and filter members by status, and to search loans by member, so that I find records quickly.
- As an Admin, I want the loans table to be usable on a phone and a tablet.

## Scope
1. **Enter submits every create/edit modal** (members, monthly payments, loans, loan payments and interest, activities, activity assignments): the modal body becomes a `<form noValidate>` whose primary button is `type="submit"` and "Cancelar" is `type="button"`. A second submit while saving is ignored. Members gets a saving state ("Guardando...", buttons disabled, modal cannot close while saving). Confirmation dialogs (member activate/deactivate) are not forms and are unchanged.
2. **Errors inside the modal:** every create/edit error (client validation and backend message as-is, UI-03) is shown in a `role="alert"` box inside the modal, above the buttons; the modal stays open with the entered data; the error is cleared when the modal opens and on each new submit. Members stops replacing the backend message with a generic one. Monthly payments separates page errors from modal errors (a validation error followed by "Cancelar" leaves no banner on the page). Page alerts remain only for list loading and row actions.
3. **Monthly payment months (MP-10):** the **"Año" field stays exactly as it is today** (free number input, default current year on create, the fee's year on edit; same position, validation and request). Only the **Mes** select changes:
   - **Create:** Mes offers only the months of the entered year in which the selected member has no non-cancelled fee (Pending and Paid block, Cancelled does not, MP-04), in calendar order, including future months; taken months are hidden. The options are recomputed when the member or the year changes. Default: the current month if available, otherwise the earliest available month; when the member or year changes and the selected month is no longer available, the default is applied.
   - **Edit:** Mes offers the fee's own month (when the year is still the fee's year) plus the months of the entered year without a non-cancelled fee for the member (the fee being edited never blocks itself).
   - Helper text below the Mes/Año row (`aria-live="polite"`): "Solo se muestran los meses de {año} en que {Nombre Apellido} no tiene cuota." Without member: Mes disabled with "Primero elige un miembro". Invalid year (empty or < 1): Mes disabled, existing "Ingresa un año válido." validation on save. All 12 taken: Mes disabled with "Sin meses disponibles" and the text "{Nombre Apellido} ya tiene cuota en todos los meses de {año}. Prueba con otro año."; submitting shows "Elige un mes sin cuota registrada." in the modal.
   - Computed in the frontend from the already loaded list (`GET /api/monthly-payments` returns all statuses to the Admin). "Agregar cuota" is enabled only when members **and** fees have loaded; the list gets loading ("Cargando cuotas…"), empty ("Aún no hay cuotas registradas.") and error-with-retry states. The backend MP-04 check stays the authority (its 409 message appears in the modal).
4. **Members search and status filter:** a filter card between the stat cards and the table: search "Buscar miembro" (placeholder "Nombre, correo o teléfono"; matches name, email and phone, case- and accent-insensitive) and status chips "Todos (n)", "Activos (n)", "Inactivos (n)" (`aria-pressed`, min 40 px tall); default "Todos". Counter "Mostrando X de Y miembros" and "Limpiar filtros". Empty result: "No hay miembros que coincidan con la búsqueda." with "Limpiar filtros". Both roles.
5. **Loans search and responsive table:**
   - Filter card: search "Buscar deudor" (placeholder "Nombre del deudor") next to the existing "Mes de inicio" select; filters combine (AND); counter "Mostrando X de Y préstamos"; one "Limpiar filtros" replaces "Ver todos los meses". Empty: month only keeps "No hay préstamos que inicien en {Mes Año}."; with search "No hay préstamos que coincidan con los filtros."; both with "Limpiar filtros".
   - Table: < 640 px: Deudor (truncated, `title` with full name), "Pendiente", actions (Editar/Anular; eye hidden), subline "Inicia dd/mm/aaaa" + badge. 640-1279 px: Deudor, Capital pendiente, Estado, actions; subline "Prestado $ X · Tasa Y% · Inicia dd/mm/aaaa" (wrapping parts). ≥ 1280 px: all columns, no subline. Header and cell paddings match per column. The table is wrapped in horizontal scroll as a safety net so actions are never clipped.
6. Shared accent-insensitive normalizer moved to `shared/lib/search.ts` (Logs reuses it).

## Out of scope
Backend changes; any change to the year field (a per-year data model is planned for a future release); limiting fee months by the member's join date (no join date in the list; `createdAt` is not the real join date); filters kept in the URL; success banner for members; monthly payments list filters; the hardcoded "Septiembre 2026" subtitle; aligning Activities/Transactions filter cards; focusing the first invalid field. (Proposed separately.)

## Business rules
- **MP-10 (new, `../business-rules.md`):** for the selected member and the entered year, the form offers only the months without a non-cancelled fee (MP-04); editing always offers the fee's own month; the backend remains the authority.

## UI conventions introduced by this spec
(Kept here, not in `business-rules.md`, which holds only business logic.)
- **Forms:** create/edit modals are `<form noValidate>`: Enter in a text/number/date/money field submits; the primary button is `type="submit"`, the others `type="button"`; a second submit is ignored while saving; Enter on selects/radios keeps native behavior. Confirmation dialogs are not forms.
- **Errors:** create/edit errors (client validation and backend message as-is, UI-03) appear inside the open modal above the buttons in a `role="alert"` box; the modal stays open with the data. Page alerts only for list loading and row actions.
- **List filters:** client-side over the loaded list, combined with AND, case- and accent-insensitive for text, with "Mostrando X de Y" and "Limpiar filtros".
- **Responsive tables:** the loans table shows secondary data in a subline below 1280 px and all columns from 1280 px; tables never clip their actions (horizontal scroll fallback).

## Data model changes
None.

## API
None (no backend changes).

## UI
See Scope. Existing classes and patterns: error box `rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]`; filter card and counter as in Activities/Logs; chips selected `bg-[#0c5c38] text-white`, otherwise `btn-ghost`.

## Acceptance criteria
1. In each of the 6 modals, pressing Enter in a text, number or money field saves exactly once; a second Enter while "Guardando..." does nothing; Enter on "Cancelar" closes without saving.
2. An invalid or duplicate member email (MEM-01, 409) shows the message inside the member modal (backend text as-is); the modal stays open and nothing appears behind it.
3. A monthly payment validation error followed by "Cancelar" leaves no error banner on the page.
4. Given member A with fees Oct 2026 Paid, Nov 2026 Pending and Dec 2026 Cancelled, when opening "Nueva cuota" for A with year 2026, then Octubre and Noviembre are not offered and Diciembre is; switching to member B offers all 12 months; changing the year to 2027 offers all 12 months for A. The year field looks and behaves as before.
5. Editing A's October 2026 fee offers Octubre (preselected) plus the free months of 2026.
6. A member with all 12 months of the entered year taken: Mes disabled with "Sin meses disponibles" and the helper text; saving shows the in-modal error.
7. "Agregar cuota" is disabled until members and fees have loaded.
8. On `/members`, typing "gal" or "gál" filters by name, email or phone; "Inactivos" shows only inactive members; the counter updates; "Limpiar filtros" resets both.
9. On `/loans`, search and month combine; an empty result offers "Limpiar filtros".
10. At 375, 768, 1024 (with sidebar) and 1280 px the loans table never clips the actions, headers align with values, and there is no page-level horizontal scroll.
11. `npm test`, `npm run lint`, `npm run build` pass; no backend file changes.

## Test plan
- Vitest (rule IDs in names): `availableMonths.test.ts` (MP-10/MP-04: Pending and Paid block, Cancelled does not, other member and other year do not block, edit uses the fee's year and includes its own month, default month and fallback), `memberFilters.test.ts` and `loanFilters.test.ts` (accent-insensitive, AND), `search.test.ts`.
- Manual on the Docker stack (test data "QA ..."): keyboard pass through every modal (Tab, Enter, Escape); criteria 1-10 at 375/768/1024/1280 px as Admin, and `/members` + `/loans` as Member at 375 px.

## Open questions
None. Owner decisions 2026-10-14: the year field is unchanged; months of the entered year minus taken (future allowed); taken months hidden; loans month = start month; UI conventions documented in the spec, not in business-rules.md. Defaults accepted by the agent on the owner's behalf (recommended options): default month = current if available else earliest available; members default filter "Todos"; native Enter behavior on selects/radios; no join-date limit.
