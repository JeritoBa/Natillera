# 011 - Admin-friendly forms and navigation

- **Status:** Implemented
- **Owner decision date / reference:** 2026-10-12 (UX spec by `ux-designer`, decisions confirmed by the owner)
- **Related rules:** UI-03, UI-08, UI-09, UI-10, UI-11, MEM-04, MEM-05, FIN-08

## Problem / goal
The Admin registers every movement, so forms must reduce mistakes and explain outcomes. Today member status changes use a bare `window.confirm`, money inputs show raw digits (50000 vs 500000 is easy to mistype), status selects do not look like the status badges used elsewhere, the backend MEM-04 message is hidden behind a generic error, and the logo does not lead anywhere.

## User stories
- As an Admin, I want to confirm activating/deactivating a member in a clear modal, and see why a deactivation was rejected, so that I can resolve pending obligations.
- As an Admin, I want money inputs formatted with thousands separators, so that I do not mistype amounts.
- As an Admin, I want status options shown as the same badges I see in detail pages, so that the meaning is obvious.
- As an Admin or Member, I want the app logo to take me to the landing page.

## Scope
1. Member activate/deactivate confirmation modal (`MemberStatusModal`), replacing `window.confirm`, showing the backend error as-is.
2. Accessibility upgrade of the shared `Modal` (applies to every modal): `role="dialog"`, `aria-modal`, `aria-labelledby`, optional `aria-describedby`, Escape closes (unless saving), focus moves inside on open, Tab is trapped, focus returns on close, labelled close button, `max-height` with internal scroll.
3. `MoneyInput` component for every money field: monthly payment amount; activity unit cost and unit sale price; loan initial amount; loan payment and loan interest amount.
4. `StatusRadioGroup` (radio group whose options render as `Badge`) replacing the status selects: monthly payment, loan interest, activity assignment.
5. Logo in `AppShell` (sidebar and mobile header) links to `/`.

## Out of scope
Changing "Ingresar" on the landing for logged-in users; distinct activate/deactivate icons; replacing `window.confirm` for "Anular" actions; renaming the "Cancelado" badge; fixing the generic error on member save; hard-coded subtitle in monthly payments; live total cost in activity form. (Proposed separately.)

## Business rules
UI-08 (money input), UI-09 (status as badges), UI-10 (accessible confirmation modal), UI-11 (logo to landing); UI-03 (backend messages as-is); MEM-04/MEM-05 (deactivation blocked by obligations, activation always allowed); FIN-08 (`Paid -> Pending` forbidden, shown as a disabled option).

## Data model changes
None. Verified on the dev database (2026-10-12): no stored money amount has a fractional part, so whole-peso inputs do not alter existing data.

## API
None. Uses existing endpoints. Money is still sent as a JSON number (whole pesos).

## UI

### 1. Member status modal (`features/members/components/MemberStatusModal.tsx`)
- Trigger: the activate/deactivate action in `MembersPage` opens the modal (no `window.confirm`). The page must stop swallowing the error: `onConfirm` lets it propagate to the modal.
- Member card: full name, email (truncated), phone (mono), status `Badge`.
- Deactivate: title "Desactivar miembro"; body "Al desactivar a **{Nombre Apellido}**:" + list "No podrá ingresar a la natillera y se cerrará su sesión." / "No se le podrán registrar cuotas, préstamos ni actividades." / "Su historial y sus ahorros se conservan."; note "Solo se puede desactivar si no tiene cuotas pendientes, préstamos activos, intereses pendientes ni actividades por pagar."; buttons "Cancelar" (`btn-ghost`) and "Desactivar" (`btn-danger`), saving text "Desactivando...".
- Activate: title "Activar miembro"; body "**{Nombre Apellido}** podrá volver a ingresar a la natillera y se le podrán registrar cuotas, préstamos y actividades."; buttons "Cancelar" and "Activar" (`btn-primary`), saving text "Activando...".
- Saving: both buttons disabled; X, Escape and overlay do not close.
- MEM-04 error (detected by pure `isPendingObligationsError` in `features/members/model/memberStatus.ts`: `ApiError`, status 400, message starts with "Member cannot be deactivated"): `role="alert"` box with "No se puede desactivar a {Nombre}.", "Primero marca como pagadas o anula sus obligaciones pendientes.", the backend message as-is (mono, small), and a link "Ver detalle del miembro" to `/members/:id`. Buttons stay enabled.
- Other errors: same alert box with `getFriendlyApiError(error)`.
- Success: modal closes, focus returns to the row button, page banner (`role="status"`) "{Nombre Apellido} quedó inactivo." / "{Nombre Apellido} quedó activo."
- Initial focus: "Cancelar".

### 2. Money input (`shared/ui/MoneyInput.tsx`, logic in `shared/lib/money.ts`)
- Displays a fixed "$" prefix (`aria-hidden`) and the amount with "." thousands separators, whole pesos only: typing `50000` shows `$ 50.000` (consistent with `formatCurrency`).
- `type="text"`, `inputMode="numeric"`; the page state holds digits only; the value sent to the API is unchanged (`Number(digits)`).
- Caret stays in place when inserting/deleting in the middle; Backspace/Delete next to a separator deletes the digit.
- Paste accepts `$ 1.250.000`, `1250000`, `1,250,000`, `50.000,00`; rejects values with non-zero decimals or other text, showing "Pega solo el valor en pesos, sin decimales." and leaving the value unchanged.
- Loading an existing amount uses `toMoneyInputValue` (rounds, never concatenates decimals).
- Not formatted as money: loan interest rate (%), year, quantities.
- Every money label gets `htmlFor`.

### 3. Status radio group (`shared/ui/StatusRadioGroup.tsx`)
- `<fieldset>` + `<legend>Estado</legend>` + one native radio per option, each option rendered with the same `Badge` as tables/detail pages (PENDIENTE yellow, PAGADO green) plus a short hint: Pending "Aún no entra a la caja", Paid "Registra el ingreso en la caja". Two columns, ≥ 44 px touch area.
- Monthly payment and loan interest: when editing a Paid item, "Pendiente" is disabled with note "Una cuota pagada no puede volver a pendiente." / "Un interés pagado no puede volver a pendiente." Create defaults stay as today.
- Activity assignment: both options enabled (editing is only possible while Pending).
- Option text comes from the badge: "Pagada" becomes "Pagado".

### 4. Logo link (`shared/layout/AppShell.tsx`)
- Sidebar and mobile header logos are wrapped in `<Link to="/" aria-label="Ir a la página principal de Gallego Nanclares">` with visible focus; same tab; session is kept. Menu button gets `aria-label="Abrir menú"`.

### Mobile (375 px)
Modal fits with internal scroll; member modal buttons are two equal columns; radio group stays two columns; money input full width.

## Acceptance criteria
1. Given the Admin on /members and an active member without obligations, When they click deactivate, Then the "Desactivar miembro" modal opens with name, email, phone and ACTIVO badge and focus on "Cancelar"; When they click "Desactivar", Then the button shows "Desactivando...", the modal closes, the row shows INACTIVO and the banner "{Nombre} quedó inactivo." appears.
2. Given a member with a pending monthly payment, When the Admin confirms deactivation, Then the modal stays open with an alert "No se puede desactivar a {Nombre}.", the English backend message as-is, and a "Ver detalle del miembro" link to the member detail.
3. Given an inactive member, When the Admin confirms "Activar", Then the member becomes active and the banner "{Nombre} quedó activo." appears.
4. Given any modal open and not saving, When Escape is pressed, Then it closes and focus returns to the opener; Tab never leaves the modal.
5. Given the new monthly payment form, When the Admin types `50000`, Then the input shows `$ 50.000` and the request body has `"amount": 50000`; deleting a middle digit keeps the caret in place.
6. Given a money input, When `$ 1.250.000` is pasted, Then it shows `1.250.000`; When `50.000,50` is pasted, Then the value is unchanged and "Pega solo el valor en pesos, sin decimales." is shown.
7. Given the new loan form, Then "Tasa de interés (%)" behaves as before (decimals allowed, no thousands formatting).
8. Given a Paid monthly payment (or Paid loan interest) being edited, Then Estado shows PAGADO selected, PENDIENTE disabled and the explanatory note; arrow keys cannot select PENDIENTE.
9. The badges in the status options look identical to the table/detail badges.
10. Given an authenticated Admin or Member (desktop and 375 px), When they click the logo, Then they reach `/` in the same tab and the session stays active.
11. Every mutation still writes its audit Log as before (no backend change).

## Test plan
- Vitest: `shared/lib/money.test.ts` (format, caret, leading zeros, 12-digit cap, paste cases, `toMoneyInputValue`), `features/members/model/memberStatus.test.ts` (MEM-04 detection).
- `npm test`, `npm run lint`, `npm run build` pass.
- Validator on the Docker stack (admin 1280 px and 375 px, member 375 px), test data named "QA ...": criteria 1-10, keyboard-only flows, backend-stopped network error in the member modal.

## Open questions
None.
