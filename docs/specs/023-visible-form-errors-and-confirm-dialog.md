# 023 - Visible form errors and confirmation dialog

- **Status:** Implemented (2026-10-26)
- **Owner decision date / reference:** 2026-10-26 (branch `v1.1.1`; UX proposal by the ux-designer; owner answers: migrate **every** `window.confirm` to the new dialog, everything consistent; **responsive is a requirement**)
- **Related rules:** UI-12 (new), UI-13 (new); UI-03, UI-10, OPS-05, FIN-06, FIN-07, FIN-13, FIN-14

## Problem / goal
1. When editing an activity, errors "are not shown". Diagnosis by code reading (to be confirmed by the validator): the backend returns `{ message }` correctly and the page stores it in `modalError`, but the error box is rendered at the bottom of a scrollable modal (`ActivitiesPage.tsx` ~L172, `Modal.tsx` ~L53) and nothing scrolls it into view; the activity form is the tallest in the app, so on laptops and phones the error appears off-screen.
2. Cancellations ("Anular") use the browser's `window.confirm`, which looks generic, can be blocked (in-app browsers) and shows errors (e.g. FIN-14) in a banner at the top of the page, far from the action.

## User stories
- As an Admin, I want to see why a save failed without scrolling, in every form.
- As an Admin, I want a clear confirmation before cancelling a record, with its consequences, and to see the error right there if the server rejects it.

## Scope
### Visible form errors (UI-12)
1. New `shared/ui/FormError.tsx` (`message: string | null`): standard error box (`role="alert"`, `rounded-lg border-[#f0c0bc] bg-[#fdf0ee] text-[#c0392b] px-3 py-2.5 text-sm`); every time `message` becomes non-null it calls `scrollIntoView({ block: 'nearest' })` (`behavior: 'smooth'` unless `prefers-reduced-motion`); it does not steal focus.
2. Used in **every** modal form with an error: activity create/edit (`ActivitiesPage`), extra cost and assignment forms (`ActivityDetailPage`), loan create/edit (`LoansPage`), loan payment/interest forms (`LoanDetailPage`), monthly payment form (`MonthlyPaymentsPage`), member form (`MembersPage`).
3. The activity form fields "Nombre", "Descripción", "Cantidad" get `id`/`htmlFor`.
4. Error texts unchanged: backend messages as-is (UI-03).

### Confirmation dialog (UI-13)
5. `shared/ui/Modal.tsx` gets an optional `role?: 'dialog' | 'alertdialog'` (default `'dialog'`, backward compatible).
6. New `shared/ui/ConfirmDialog.tsx` on top of `Modal`:
   ```ts
   interface ConfirmDialogProps {
     title: string
     summary?: ReactNode          // record card, as in MemberStatusModal
     consequences: string[]
     confirmLabel: string
     runningLabel?: string        // default "Anulando…"
     cancelLabel?: string         // default "Volver"
     onConfirm: () => Promise<void>   // if it throws, the error is shown inside
     onClose: () => void
   }
   ```
   - `role="alertdialog"`, `aria-describedby` = consequences; initial focus on "Volver" (first in DOM, left).
   - Esc and backdrop click close it, except while the request runs.
   - While running: both buttons disabled, the danger button reads "Anulando…", panel `aria-busy`.
   - Error: shown **inside** the dialog with `FormError` and `getFriendlyApiError` as-is (UI-03); the dialog stays open and the same button retries. No top-of-page banner for cancellation errors.
   - Success: the parent closes the dialog, shows its existing success banner (now `tabIndex={-1}`, receives focus because the triggering button disappears) and reloads.
   - Buttons: `flex gap-3`, both `flex-1 py-2.5 min-h-10`; "Volver" `btn-ghost`, confirm `btn-danger`. Panel `max-w-lg mx-4`; at 320 px both buttons fit in one row.
7. **Every** `window.confirm` in the frontend is replaced:

| Place | Title | Consequences | Confirm |
|---|---|---|---|
| `LoanDetailPage` loan payment | "Anular abono" | "El abono y su ingreso en la caja quedarán anulados." · "El capital pendiente aumentará en {monto}." · "No se puede deshacer." | "Anular abono" |
| `LoanDetailPage` interest (Paid) | "Anular interés" | "El interés y su ingreso en la caja quedarán anulados." · "Bajarán los rendimientos que se reparten entre los socios." · "No se puede deshacer." | "Anular interés" |
| `LoanDetailPage` interest (Pending) | "Anular interés" | "El interés quedará anulado y dejará de contarse como pendiente por cobrar." · "No se puede deshacer." | "Anular interés" |
| `LoansPage` loan | "Anular préstamo" | from the current confirm message, plus "No se puede deshacer." | "Anular préstamo" |
| `ActivitiesPage` activity | "Anular actividad" | idem | "Anular actividad" |
| `ActivityDetailPage` extra cost | "Anular costo extra" | Paid: "El costo y su egreso quedarán anulados y se devolverá a los intereses que se reparten." · Pending: "El costo extra quedará anulado." + "No se puede deshacer." | "Anular costo extra" |
| `ActivityDetailPage` assignment | "Anular asignación" | current texts (Paid / Pending variants) + "No se puede deshacer." | "Anular asignación" |
| `MonthlyPaymentsPage` fee | "Anular cuota" | current text + "No se puede deshacer." | "Anular cuota" |

   The summary card shows the record (date, amount, member/description and its status `Badge`). After the change, no `window.confirm` remains in `src/` (except tests, if any).

## Out of scope
- Cancel buttons on `LoanPaymentDetailPage` / `InterestPaymentDetailPage`.
- Field-level errors (`aria-invalid`, focus on the first invalid field); frontend pre-checks (e.g. price change with paid assignments).
- Member activation/deactivation modal (already compliant, UI-10).

## Business rules
New UI rules (behavior-affecting frontend conventions): **UI-12** visible form errors, **UI-13** cancellation confirmation dialog. No financial rule changes; cancellations keep FIN-06/FIN-07 and the backend guards (FIN-13, FIN-14). See `../business-rules.md`.

## Data model changes
None.

## API
None.

## UI
As in Scope. Responsive (requirement, 320-1920 px): dialogs never exceed the viewport (`max-h-[calc(100dvh-2rem)]`, body scroll inside), buttons >= 40 px, no horizontal page scroll; the error box inside forms and dialogs is always brought into view.

## Acceptance criteria
1. Given 1366x768 and the "Editar actividad" modal of an activity with paid assignments, when the Admin changes "Precio de venta unitario" and presses Enter, then the backend message (e.g. "Unit sale price cannot change because there are paid assignments.") is visible without manual scrolling. (The validator first confirms the root cause on Docker.)
2. The same at 375 px with a quantity lower than assigned and with a cost above the available money (FIN-13 "Insufficient available money…").
3. Clicking the "Nombre" label focuses its field (same for "Descripción" and "Cantidad").
4. Every modal form listed in Scope 2 shows its error with `FormError` brought into view.
5. When the Admin presses "Anular" on a loan payment, then an `alertdialog` opens with the focus on "Volver"; Esc closes it and returns the focus to the button.
6. When the Admin confirms, then the button reads "Anulando…" and the dialog cannot be closed; on success it closes, the focus goes to the success banner and the row shows "Anulado".
7. Given a Paid interest whose cancellation violates FIN-14, then the backend message appears inside the dialog, the dialog stays open and no top banner appears.
8. No `window.confirm` remains in `Natillera.Frontend/src` (grep), and each of the 8 places in Scope 7 uses `ConfirmDialog` with the texts above.
9. At 320 and 375 px the dialog fits, buttons are >= 40 px, no horizontal page scroll.
10. The public demo still blocks writes as today (the dialog opens; the demo write toast behavior is unchanged).
11. `npm test`, `npm run lint` and `npm run build` pass.

## Test plan
- Vitest for pure helpers (e.g. consequence texts per record/status if extracted to a model function) referencing UI-13.
- Validator on Docker: reproduce criterion 1 before and after, every cancellation flow with "QA ..." data (cancelled afterwards are terminal by design), keyboard and screen-reader checks, widths 320/375/768/1280.

## Open questions
None (answered 2026-10-26).
