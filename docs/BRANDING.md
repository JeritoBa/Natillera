# Branding - Natillera Gallego Nanclares

Brand identity standard for the product. **Everything here is taken from what is already built** (landing copy, `src/index.css`, shared UI components, logo files, `AGENTS.md` UI conventions, spec 009 and the UI rules in `business-rules.md`). It does not introduce new brand elements. When the product changes, update this file in the same change.

UI copy is Spanish and is quoted verbatim; the rest of this document is in English like all repository docs.

---

## 1. What a natillera is

A **natillera** is an informal community savings group, traditional in Colombia. In the product's own words (landing, section "¿Qué es una natillera?"):

> "Es un ahorro en grupo, de los de toda la vida en Colombia. Cada mes, cada miembro pone su cuota en un fondo común."
>
> "Ese fondo no se queda quieto: se les presta a los mismos miembros con un interés acordado, y se usa para comprar productos que vendemos entre todos. Lo que se gana vuelve al grupo."
>
> "Es como el marranito de la casa, pero de toda la familia."

How a month works (landing, "Así funciona un mes en la natillera" - "Sin letra menuda: esto es lo que pasa con la plata."):

| Step | Copy | Money flow tag |
|---|---|---|
| 1 | **Cada uno paga su cuota** - the Admin registers each member's fee; late fees stay pending and the member sees it on entry. | "Entra al fondo" |
| 2 | **La plata se presta adentro** - members borrow from the fund, pay monthly interest on what they still owe and pay down principal, never more than they owe. | "Sale del fondo" |
| 3 | **Los intereses se reparten** - interest is shared equally among active members, not kept by a bank. | "Entra al fondo" |
| 4 | **Vendemos juntos** - the natillera buys products, each member gets units to sell and keeps the profit of what they sell. | "Sale y vuelve con ganancia" |
| 5 | **Todo queda anotado** - every peso in or out is a movement with date and description; mistakes are not deleted, they are voided ("se anula, y queda la huella"). | "Queda registrado" |

## 2. Purpose

**Of the natillera (for its members)** - landing, "Lo que ganas":

- "Un ahorro que sí se cumple." The monthly fee helps you save even in a tight month.
- "Préstamos sin bancos." Loans come from the fund and interest stays in the family.
- "Tu parte de los intereses." Interest is shared among all active members.
- "Ganancia por vender." Sales profit is credited to you.
- "Cuentas claras." You can see at any time how much there is and how every peso moved.

What the natillera asks in return ("Lo que te pedimos"): pay your fee every month; if you take a loan, pay interest monthly and pay down principal; answer for the units you receive to sell.

**Of this application:** replace the iPhone note and the generic money app that produced inconsistent balances, so the family group has **one trustworthy ledger**. The non-negotiable principle (AGENTS.md): *financial data integrity and consistency come before speed, features, or convenience.*

## 3. Brand name

| Use | Form |
|---|---|
| Full name (page title, metadata, footer) | **Natillera Gallego Nanclares** |
| Wordmark in the logo | **Gallego Nanclares** |
| Generic noun in copy | "la natillera" (lowercase), e.g. "Ingresar a mi natillera", "¿Quieres entrar a la natillera?" |
| Footer | "Natillera Gallego Nanclares · Colombia" |

## 4. Concept, promise and audience

- **Tagline (hero and social metadata):** "Familia que ahorra junta, **prospera junta.**" (the second half in brand green).
- **Meta description:** "Natillera Gallego Nanclares: cuotas mensuales, préstamos entre miembros y ventas en grupo, con cuentas claras para todos."
- **Core concept:** the family piggy bank (*el marranito*), made transparent. The logo is a pig snout; the visual language is a **ledger notebook** ("libreta"): everything written down, nothing erased.
- **Brand promise:** *cuentas claras* - "Tus cuentas, sin tener que preguntarle a nadie." Balances are calculated from movements: "Nadie la escribe a mano."

**Audience archetypes** (as defined by the product, not personas invented here):

| Archetype | Who | What they need from the brand |
|---|---|---|
| **Miembro** (member) | A member of the Gallego Nanclares family group. Read-only user. | See how much there is, how much they have saved and earned, what they still owe ("Mira cuánto hay, cuánto llevas y qué te falta por pagar."). |
| **Administrador** (admin) | The manager of the natillera; registers every fee, loan, activity and sale. | Fast, mistake-proof registration and a trustworthy audit trail. |
| **Visitante** (prospective member) | Someone considering joining ("¿Todavía no? Te contamos cómo funciona y cómo entrar."). | Understand what a natillera is and how to join via WhatsApp. |

## 5. Voice and tone

- **Language:** Spanish (Colombia), `lang="es"`. Speak to the user as **tú** ("Tus cuentas", "Lo que ganas").
- **Plain, colloquial and warm:** "plata", "el marranito", "Sin letra menuda". Short sentences; explain money in everyday words.
- **Honest and transparent:** say what happens with the money; label every example as fictitious; never hide errors.
- **Family, not bank:** "los intereses se quedan en la familia", "Préstamos sin bancos".

**Vocabulary (use these words consistently):**

| Concept | Word in UI |
|---|---|
| Monthly fee | **cuota** (cuota mensual) |
| Common fund / cash | **fondo**, **caja**, "dinero disponible" |
| Loan / repayment | **préstamo** / **abono** (abonar al capital) |
| Loan interest earnings | **intereses**; in the ledger **Rendimiento** |
| Group sales | **actividades**, **venta** |
| Income / expense | **Ingreso** / **Egreso** |
| Void a record | **Anular** (never "Eliminar"; UI-01) |
| Log in | **Ingresar** |
| Join | **Quiero unirme** / **Escribir por WhatsApp** |

**Messages:** backend business errors are English and shown **as-is** (UI-03); standard HTTP failures map to friendly Spanish messages (e.g. "Tu cuenta está desactivada. Contacta al administrador.", "Tu sesión ya no es válida. Inicia sesión de nuevo.").

## 6. Logo

The logo is a **pig snout** (the *marranito*) followed by the wordmark "Gallego Nanclares" in a heavy rounded sans-serif, all in brand green.

| File | Use |
|---|---|
| `Natillera.Frontend/public/logo-gallego-nanclares.png` | Horizontal logo (snout + name) on light backgrounds. Trimmed, transparent background. |
| `Natillera.Frontend/public/logo-gallego-nanclares-invertido.png` | White/inverted version for green backgrounds. |
| `Natillera.Frontend/public/favicon.svg` | Snout mark alone (favicon, decorative brand mark). |
| `Natillera.Frontend/design/*` | Original source files (square logo, logo with text on the right, inverted version). |

Usage rules (from `BrandLogo.tsx`, `AppShell.tsx`, spec 009):

- Size by **height**, width auto: `h-8` by default, `h-7` in the mobile header.
- Alt text: "Gallego Nanclares".
- On green backgrounds use only the inverted version.
- In the authenticated app the logo links to the landing `/` (UI-11).
- Do not recolor, stretch, or redraw the logo; use the provided files.

## 7. Color palette

Source: `Natillera.Frontend/src/index.css` (tokens and component classes) and usage across `src/**/*.tsx`. Ordered by role.

### Core tokens

| Token | Hex | Role |
|---|---|---|
| `--primary` / `--ring` | `#0c5c38` | **Brand green.** Primary buttons, active navigation, links, focus outline, highlighted words, green headline blocks. Also `theme-color`. |
| (hover of primary) | `#0a4e30` | `btn-primary:hover`. |
| `--accent` | `#117a45` | Secondary green accent. |
| `--foreground` | `#0c1a12` | Main text (near-black green). |
| `--muted-foreground` | `#4e7460` | Secondary text, labels, eyebrows. Most used text color. |
| `--background` | `#f5f7f5` | Page background. |
| `--card` | `#ffffff` | Cards, inputs, panels. |
| `--secondary` | `#ebf2ed` | Hover backgrounds (navigation, ghost buttons). |
| `--muted` | `#eef4f0` | Soft surfaces, table row separators, tinted sections. |
| `--border` | `#d6e8dc` | Borders and offset shadows. |
| (surface tint) | `#f8fbf8` | Table row hover, inner preview boxes. |
| (light green on green) | `#cfe8da` | Secondary text over the green headline block. |
| (placeholder) | `#9dbdaa` | Input placeholders. |
| (scrollbar) | `#c8ddd0` | Scrollbar thumb. |

### Semantic / status colors

| Meaning | Background | Text | Border | Used in |
|---|---|---|---|---|
| Positive (Pagado, Activo, Cerrada, Ingreso) | `#dcf5e8` | `#0a6635` | - | `badge-positive` |
| Pending (Pendiente) | `#fef6dc` | `#9a6e00` (`#7a5600` in notices) | `#f3dc9a` | `badge-pending`, pending-fee notice |
| Negative (Cancelado, Vencido, Egreso) | `#fde8e4` | `#c0392b` | - | `badge-negative` |
| Neutral (Inactivo) | `#eef4f0` | `#4e7460` | - | `badge-neutral` |
| Success message | `#eef9f1` | `#0a6635` | `#b8e2c8` | Success banners (`role="status"`) |
| Error / danger | `#fdf0ee` | `#c0392b` | `#f0c0bc` (hover `#e05a4a`) | Error alerts, `btn-danger` (Anular) |
| Selected option | `#f3f8f5` | - | `#0c5c38` | Status radio group (UI-09) |

### Transaction type colors (ledger)

| Type (UI label) | Text | Background |
|---|---|---|
| Cuota mensual, Pago préstamo | `#0a6635` | `#dcf5e8` |
| Actividad | `#9a6e00` | `#fef6dc` |
| Venta, Rendimiento | `#0074b3` | `#ddf0ff` |
| Préstamo | `#c0392b` | `#fde8e4` |

Rules: green is the brand; red only signals expense, voided/negative status or danger actions. **Negative amounts are shown only with a "-" sign, never with red backgrounds** (UI-02).

## 8. Typography

Loaded from Google Fonts in `src/index.css`.

| Family | Weights loaded | Role |
|---|---|---|
| **Outfit** | 300-800 | Headings (`h1`-`h6`) and buttons (`btn-primary` 600, `btn-ghost`/`btn-danger` 500). |
| **Inter** | 400, 500, 600 | Body text, inputs, tables (default `body` font). |
| **JetBrains Mono** | 400, 500, 600 | **Figures and money** (`.mono`), badges (0.68rem, uppercase, letter-spacing 0.04em, 600), eyebrows. |

Patterns used on the landing:

- **Hero title:** Outfit extra-bold, very tight tracking (`-0.03em`), line-height ~1.02, `#0c1a12` with the key phrase in `#0c5c38`.
- **Section title (H2):** Outfit bold, 3xl-4xl, tracking `-0.02em`.
- **Eyebrow:** JetBrains Mono, xs, uppercase, tracking `0.14em`, `#4e7460` (e.g. "PARA QUIEN NO LA CONOCE", "SI YA ERES PARTE").
- **Body:** Inter, base-lg, relaxed line-height, `#4e7460`, max ~60 characters per line.

## 9. Numbers and money

- Currency: **COP without decimals**, Colombian format: `formatCurrency` -> `$ 1.234.567` (`Intl.NumberFormat('es-CO', { currency: 'COP', maximumFractionDigits: 0 })`).
- Compact figures: `$1.2M`, `$350K` (`formatShortCurrency`).
- Money inputs show `$` prefix and `.` thousands separators while typing (UI-08).
- Figures are set in JetBrains Mono.
- Negative values: "-" sign only (UI-02). Income/expense direction is shown with the "Ingreso"/"Egreso" badges and transaction type colors.
- Months are written in Spanish with initial capital ("Enero" ... "Diciembre").

## 10. Visual style: the ledger notebook

- **Calm, paper-like surfaces:** light green-gray page (`#f5f7f5`), white cards, thin green-tinted borders (`#d6e8dc`).
- **Solid offset shadows** instead of blurred ones: `5px 5px 0 0 #d6e8dc` (cards), `6px 6px 0 0 #d6e8dc` (hero card), `3px 3px 0 0 rgba(0,0,0,0.12)` (chat bubble).
- **Radius:** base `0.5rem` (inputs, buttons, badges `rounded`), cards `rounded-xl`.
- **Green headline block** on detail pages: green background with a `<dl>` breakdown in white / `#cfe8da` (UI-05).
- **Details:** dashed circular borders around the brand mark; mono uppercase labels; lists that read like ledger lines.
- **Icons:** line icons, stroke width 2, round caps/joins, `currentColor` in brand green, with soft fill accents in `#dcf5e8` (`LandingIcons.tsx`).
- **Motion:** subtle `fadeUp` (0.35 s, staggered 60 ms); transitions 100-150 ms; everything disabled under `prefers-reduced-motion`.

## 11. Components (brand-relevant)

| Component | Look |
|---|---|
| `btn-primary` | Green `#0c5c38`, white Outfit 600; hover darker + lifts 1 px. |
| `btn-ghost` | Transparent, `#4e7460` text, `#d6e8dc` border; hover green border/text on `#ebf2ed`. |
| `btn-danger` | Red outline `#c0392b` / `#f0c0bc`; used for "Anular" and "Desactivar". |
| Badge | Uppercase mono pill (see status colors). Labels: Pagado, Pendiente, Activo, Inactivo, Cerrada, Completado, Ingreso, Egreso, Vencido, Cancelado. |
| Inputs | White, `#d6e8dc` border; focus green border + 3 px soft green ring. |
| Modal overlay | `rgba(12, 26, 18, 0.5)` with 2 px blur. |
| Stat card | White, `#d6e8dc` border, green border on hover. |

Layout and page patterns (AGENTS.md UI conventions): detail pages = header with name + badge, green headline block, secondary cards, tables ordered by status, final "Details" section, loading / 404 / error-with-retry states, `document.title` with the entity name. Mobile (375 px): main cell + amount + actions, secondary data in a small line below.

## 12. Content rules

- **Landing is public and never shows real data.** Example figures are always labeled: "Ejemplo · datos ficticios", "Vistas previas · datos ficticios", "Las cifras son de ejemplo, no son de la natillera." (UI-07). Example names are generic ("Miembro A", "Miembro B").
- **Joining** happens only through WhatsApp: `https://wa.me/573123326094?text=Quiero%20unirme%20a%20la%20natillera` ("Escribir por WhatsApp", opens in a new tab with an accessible hint).
- **Login copy:** "Entras con el correo y la contraseña que te dio el administrador."
- Voided records stay visible with their status; never imply that something was deleted.

## 13. Accessibility (part of the brand)

- Visible focus: 2 px outline in `#0c5c38` with offset.
- Skip link "Saltar al contenido"; decorative images and icons are `aria-hidden`; screen-reader hints (e.g. "(abre WhatsApp en una pestaña nueva)").
- Touch targets around 44 px on mobile; layouts tested at 375 px without horizontal scroll.
- Reduced-motion respected.

## 14. Do and don't

| Do | Don't |
|---|---|
| Use brand green `#0c5c38` for primary actions and emphasis. | Introduce new brand colors or fonts. |
| Show money in JetBrains Mono, COP, no decimals. | Show decimals or red backgrounds for negative amounts. |
| Say "Anular" and keep the record visible. | Say "Eliminar" or hide voided records. |
| Speak plainly, in tú, about "plata", "cuota", "fondo". | Use banking jargon or fine print. |
| Label every example figure as fictitious. | Show real member data on public pages. |
| Use the provided logo files, sized by height. | Recolor, stretch or redraw the snout. |

## 15. Known inconsistencies (to resolve, not decided here)

- The UI verb is "Anular" but the status badge reads **"Cancelado"** (proposal pending: rename to "Anulado").
- Loan interest is called "intereses" in copy but **"Rendimiento"** in the transactions ledger.
- `--accent` (`#117a45`) is defined but rarely used.

## Sources

`AGENTS.md` (UI conventions), `docs/specs/009-landing-and-auth-ui.md`, `docs/business-rules.md` (UI-01..UI-11), `Natillera.Frontend/index.html`, `src/index.css`, `src/shared/lib/formatters.ts`, `src/shared/lib/contact.ts`, `src/shared/ui/Badge.tsx`, `src/shared/ui/BrandLogo.tsx`, `src/features/landing/**`, `src/features/transactions/pages/TransactionsPage.tsx`, `public/` and `design/` logo files.
