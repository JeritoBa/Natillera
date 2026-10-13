# Promo video storyboard - Natillera Gallego Nanclares

Approved by the owner on 2026-10-12 (storyboard by `ux-designer`, decisions P1-P6 resolved). Brand source of truth: [`docs/BRANDING.md`](../docs/BRANDING.md). Do not introduce colors, fonts or copy that are not listed here or in BRANDING.

## Format
- Remotion composition `NatilleraPromo`: 1080x1920 (9:16), 30 fps, 900 frames (30 s). Audio: `public/music.mp3`. No voice-over; every message is on-screen text (readable muted).
- Goal: invite family members to join the natillera; ends with the WhatsApp CTA and the app URL.
- All UI is recreated as React components with **fictitious data** (UI-07). Show the "datos ficticios" label whenever figures are on screen. Only "Miembro A/B/C" names.

## Owner decisions
- P1 Hook copy: **"¿Las cuentas no cuadran?"**
- P2 Fake note mock approved: "Cuota Miembro A 100.000", "Cuota Miembro B 100.000", "Total 250.000" struck through + "¿?" in `#c0392b`.
- P3 Closing URL: **natillera-web.onrender.com** (verified live). Never show the WhatsApp phone number.
- P4 Keep the scene 3 eyebrow and the scene 5 ranking; revisit after the first render if too dense.
- P5 Savings bar third segment: **`#cfe8da`** (not `#8fd1ad`).
- P6 Music: "Ukulele Fun Acoustic Background (Happy Strings)" by NRA-LAB, Pixabay Content License, not Content ID registered: https://pixabay.com/music/happy-childrens-tunes-ukulele-fun-acoustic-background-happy-strings-221183/ . No attribution required (credit optional in the post description).

## Shared system
- Safe area for text: y 250-1570, x 120-960 (840 px wide). Outside: only backgrounds/decorative watermarks. Provide a `showSafeAreas` prop overlay.
- Type scale (px at 1080 wide): hero Outfit 800 100-120 (tracking -0.03em, lh 1.02); H2 Outfit 700 72-80 (-0.02em, lh 1.1); highlight phrase Outfit 700 72 (lh 1.2); card/row title Outfit 600 46-52; body Inter 400/500 38-44; figures JetBrains Mono 600 56-64 (`tabular-nums`); eyebrow/badge JetBrains Mono 600 32 uppercase (tracking 0.14em eyebrow, 0.04em badge). **Minimum 32 px.**
- Ledger style: white cards, 2 px border `#d6e8dc`, radius 30, offset shadow `12px 12px 0 0 #d6e8dc` (hero card 14 px). Badges radius 12, padding 10/20.
- Colors (only these, from BRANDING): `#0c5c38` primary, `#0a4e30`, `#117a45`, `#0c1a12` text, `#4e7460` muted, `#f5f7f5` page, `#ffffff`, `#ebf2ed`, `#eef4f0`, `#d6e8dc`, `#f8fbf8`, `#cfe8da`, `#dcf5e8`/`#0a6635` positive, `#fef6dc`/`#9a6e00`/`#7a5600`/`#f3dc9a` pending, `#c0392b` error.
- Motion: standard fadeUp = opacity 0->1 + translateY 24->0 over 10 frames, `Easing.out(Easing.cubic)`; pops = `spring({damping: 14, stiffness: 120, mass: 0.8})`; base stagger 15 frames (1 beat at 120 BPM). Nothing flashes more than 3x/s. ~3 words/s reading; text stays until its scene ends.
- Fonts via `@remotion/google-fonts`: Outfit (600, 700, 800), Inter (400, 500, 600), JetBrains Mono (500, 600).

## Assets
- `public/favicon.svg` (vector snout, fill `#0c5c38`; white via `filter: brightness(0) invert(1)`; animate with scale/opacity only, it is a fill, not a stroke).
- `public/logo-gallego-nanclares.png` (663x120, transparent) and `public/logo-gallego-nanclares-invertido.png` (656x120): **never taller than 120 px**, never recolored/stretched. Do **not** use `Natillera.Frontend/design/*` (no transparency; wrong green).
- Copy these three files unchanged from `Natillera.Frontend/public/` into `promo/public/`.
- Icons: import `LandingIcon` from `Natillera.Frontend/src/features/landing/components/LandingIcons.tsx` unchanged (stroke icons, viewBox 48, `currentColor`, accent fill `#dcf5e8`). Stroke draw via wrapper CSS: `.draw svg *{stroke-dasharray:120;stroke-dashoffset:var(--draw)}` and `.draw svg [fill="#dcf5e8"]{fill-opacity:var(--fill)}`.
- `formatCurrency` from `Natillera.Frontend/src/shared/lib/formatters.ts` unchanged (`$ 2.350.000`).

## Rhythm
- Target 120 BPM: beat = 15 frames, bar = 60. Nominal cuts: 120, 240, 390, 600, 780. If the measured BPM differs (accepted 100-128), recompute cuts with `beatFrame(n) = Math.round(MUSIC_OFFSET_FRAMES + n * 1800 / BPM)` to the nearest beat, moving no scene more than ±10 frames. `BPM` and `MUSIC_OFFSET_FRAMES` live in `theme.ts`.
- Music volume: 0 -> 0.8 over frames 0-6, hold, 0.8 -> 0 over 870-899.

## Scenes

### 1. Hook - frames 0-119 (0-4 s), background `#f5f7f5`
- Headline "¿Las cuentas no cuadran?" (NEW, approved): Outfit 800 100-110 px `#0c1a12`, y≈300, two lines ("¿Las cuentas" / "no cuadran?").
- Badge "Ejemplo · datos ficticios" (`#eef4f0` / `#4e7460`), y≈640.
- Fake note card (840 wide, y≈700-1250): rows "Cuota Miembro A" 100.000, "Cuota Miembro B" 100.000, separator, "Total" (Inter 600) 250.000. Labels Inter 44 `#0c1a12`, amounts Mono 600 52 right-aligned, separators 2 px `#eef4f0`.
- Animation: 0-12 headline fadeUp word by word (2-frame stagger); 10-25 note springs in from y+60, badge fadeUp at 12; 25-70 rows "type in" (1 char/frame) starting 25, 40, 55; 75 a 4 px `#c0392b` strike line grows left->right over 8 frames over the total; 85-95 "¿?" (Outfit 800 64 `#c0392b`) springs in with rotation -6°->0; 110-119 scene moves up 80 px and fades.

### 2. Brand - frames 120-239 (4-8 s), background `#f5f7f5`
- Snout `favicon.svg` 320 px centered inside the landing's dashed ring (440 px circle, 4 px dashed `#0c5c38` at 35% opacity).
- Then horizontal logo (120 px tall, centered, y≈420) and tagline in three lines, Outfit 800 100 px: "Familia que" / "ahorra junta," (`#0c1a12`) / "prospera junta." (`#0c5c38`).
- Animation (local frames): 0-20 snout spring scale 0.6->1 + fade, ring rotates 0->20° over the scene; 30 snout+ring fade out (10 f) while the logo wipes in (`clipPath inset(0 100%->0 0 0)`, 15 f, `Easing.inOut(cubic)`); 45/52/60 tagline lines fadeUp, green line springs scale 0.96->1; 110-119 fade.

### 3. What is a natillera - frames 240-389 (8-13 s), background `#ffffff`
- Watermark: `favicon.svg` 900 px at x -240, bottom edge y≈1900, opacity 0.06, drifts up 40 px linearly.
- Eyebrow "Para quien no la conoce" (Mono 32 `#4e7460`, uppercase) y≈360; H2 "¿Qué es una natillera?" (Outfit 700 80 `#0c1a12`) y≈420.
- Quote "Es como el marranito de la casa, pero de toda la familia." Outfit 700 72 `#0c5c38`, lh 1.2, left border 12 px `#0c5c38`, padding-left 48, y≈700.
- Ornament (y≈1200-1440): white circle 320 px, border `#d6e8dc`, shadow `12px 12px 0 0 #d6e8dc`, inner dashed ring 240 px, snout 140 px.
- Animation (local): eyebrow fadeUp 0-10, H2 6-18; quote word by word from 30 (3 f/word, done by 66); ornament spring scale 0->1 with -8°->0 rotation at 75.

### 4. A month in the natillera - frames 390-599 (13-20 s), background `#f5f7f5`
- Eyebrow "Paso a paso"; H2 "Así funciona un mes en la natillera" (Outfit 700 76, two lines); 2 px `#0c1a12` rule under the H2; rows separated by 2 px `#d6e8dc`, ~190 px each, y≈580-1530.
- Rows (icon in a 128 px `#ebf2ed` circle, icon 84 px `#0c5c38`; title Outfit 600 52 `#0c1a12`; tag Mono 600 32):
  1. `LandingIcon.Cuota` "Cada uno paga su cuota" - tag "Entra al fondo" (positive `#dcf5e8`/`#0a6635`)
  2. `LandingIcon.Presta` "La plata se presta adentro" - "Sale del fondo" (neutral `#eef4f0`/`#4e7460`)
  3. `LandingIcon.Reparto` "Los intereses se reparten" - "Entra al fondo" (positive)
  4. `LandingIcon.Venta` "Vendemos juntos" - "Sale y vuelve con ganancia" (neutral)
  5. `LandingIcon.Libreta` "Todo queda anotado" - "Queda registrado" (neutral)
- No long descriptions.
- Animation (local): eyebrow+H2 fadeUp 0-15; rows at 30, 60, 90, 120, 150: circle spring scale 0->1, icon stroke draw over 18 f (fill appears in the last 8), title fadeUp +4 f, tag pop spring 0.8->1 at +8 f; 200-209 fade out.

### 5. What you see when you enter - frames 600-779 (20-26 s), background `#eef4f0`
- H2 "Lo que ves cuando entras" (Outfit 700 76) y≈280; badge "Vistas previas · datos ficticios" y≈390.
- Four cards (840 wide, ~250 tall, gap 24, white with offset shadow), title Outfit 600 46 `#0c1a12` with a 72 px icon `#0c5c38`:
  1. `LandingIcon.Caja` "Cuánto hay disponible": green block `#0c5c38` radius 20, "Disponible" Inter 36 `#cfe8da`, figure Mono 600 64 `#ffffff` -> `$ 2.350.000`.
  2. `LandingIcon.Ahorro` "Cuánto llevas ahorrado y ganado": `$ 1.240.000` Mono 600 60 `#0a6635`; 20 px bar 88% `#0c5c38` / 7% `#117a45` / 5% `#cfe8da`; caption "Cuotas · Actividades · Intereses" Inter 34 `#4e7460`.
  3. `LandingIcon.Aviso` "Tus cuotas pendientes": notice "1 cuota pendiente" Inter 500 40, text `#7a5600`, bg `#fef6dc`, 2 px border `#f3dc9a`.
  4. `LandingIcon.Trofeo` "Actividades y ranking de ventas": rows Miembro A `$ 120.000`, Miembro B `$ 95.000`, Miembro C `$ 70.000`; position circles 52 px (1: `#0c5c38`/white; 2-3: `#dcf5e8`/`#0a6635`); names Inter 38, amounts Mono 600 38.
- Animation (local): H2+badge fadeUp 0-12; cards fadeUp from y+40 at 20, 44, 68, 92; figures count up 0->value over 30 f (`Easing.out(cubic)`), rounded to thousands while counting, exact value at the end, fixed-width container + `tabular-nums`; bar grows 0->100% over 24 f (4 f stagger per segment); notice pulse 1->1.04->1 at local 120; ranking rows fadeUp 6 f apart with counting amounts; 170-179 fade out.

### 6. Close - frames 780-899 (26-30 s), background `#0c5c38`
- Watermark: white snout 640 px at x 640, y 1500, opacity 0.07.
- Inverted logo 120 px tall (y≈300).
- "Cuentas claras." Outfit 800 120 `#ffffff` (y≈600).
- Chat bubble (y≈850): white, radius 48 with bottom-right 8, shadow `8px 8px 0 0 rgba(0,0,0,0.12)`; label "Tu mensaje" Mono 600 32 `#4e7460` uppercase; message "Quiero unirme a la natillera" Inter 500 44 `#0c1a12`.
- Button "Escribir por WhatsApp ↗" (y≈1150): white background, text `#0c5c38` Inter 600 48, height 120, radius 20, padding-x 56.
- URL "natillera-web.onrender.com" Mono 500 44 `#cfe8da` (y≈1330).
- Animation (local): 0-10 green panel slides up (translateY 100%->0, `Easing.out(cubic)`) over `#eef4f0`; logo fades 8-20; "Cuentas claras." springs scale 0.92->1 at 15; bubble springs from x+40 at 30; button fadeUp at 45, URL at 52; button pulse 1->1.03->1 at 60 and 90; 60-119 static end frame.

## Deliverables
- Thumbnail: `npx remotion still NatilleraPromo out/thumbnail.png --frame=225`.
- Render: `npx remotion render NatilleraPromo out/natillera-promo.mp4 --codec=h264 --crf=18`.

## Acceptance criteria
1. MP4 1080x1920, 30 fps, 900 frames (30.0 s), AAC audio.
2. With `showSafeAreas`, no text outside y 250-1570 / x 120-960.
3. No hex outside `theme.ts`; all `theme.ts` hex from the list above; no text under 32 px; only the three font families.
4. Scenes 1 and 5 show "datos ficticios" while figures are visible; only "Miembro A/B/C".
5. Logos never deformed/recolored, never taller than 120 px; `design/` files unused.
6. Cuts at 120, 240, 390, 600, 780 (or beat-recomputed values).
7. `public/music/LICENSE.md` or equivalent license record exists.
8. Outside `promo/`, only `.gitignore` changes (`promo/out/`); frontend lint/build/test still pass.

## Square 1:1 version (`NatilleraPromoSquare`)
Same audio, scene order, cuts (120, 240, 390, 600, 780), copy, colors, fonts, assets and animation timings; only sizes and positions change (`LAYOUTS.square` in `src/theme.ts`, selected by the `format` prop). 1080x1080, text safe area x 80-1000, y 80-1000, min text 32 px. Render: `npm run render:square`, thumbnail: `npm run still:square`.
- Hook: headline Outfit 800 88 at y 180 (two lines); badge y 380; note card y 490 (padding 16/40, rows 96 px, labels Inter 40, amounts Mono 48); "¿?" 64 px below the card, right-aligned at x 1000, y 835.
- Brand: dashed ring 330 / snout 240 centered (y 375); logo 120 px at y 323; tagline 88 px from y 479 (logo + tagline centered as a group).
- WhatIs: eyebrow + H2 68 at y 190; quote 60 px with 12 px left border at y 380; ornament 240 (ring 180, snout 105) at x 760, y 760; watermark snout 700 at x -200, y 500.
- MonthSteps: H2 60 (two lines) at y 80; five rows of 140 px from y 290 (circle 96, icon 64, title Outfit 600 42, tag Mono 32); last row ends at y 990.
- MemberViews: H2 60 + badge from y 80; 2x2 card grid at y 240 (cards 450 wide, gap 20, heights 370/370/330/330); card titles 36 px (wrap to two lines) with 56 px icons; "Disponible" block stacks label (Inter 32) over figure (Mono 48); saved figure Mono 48; notice 36; ranking rows 44 px (Inter/Mono 32).
- Close: logo 120 px at y 202; "Cuentas claras." 96 at y 362; bubble y 500 (text 40); button 100 px tall (text 44) at y 694; URL Mono 40 at y 830; watermark snout 520 at x 640, y 830.

## English version (`NatilleraPromoSquareEn`)

Same square layout, timings, animations, assets and music as `NatilleraPromoSquare`; only the copy changes (`lang: 'en'`, strings in `src/copy.ts`). Numbers (`$ 2.350.000`, `100.000`, `250.000`), logos, the URL and the word "natillera" are unchanged. Word-by-word reveals and typed rows keep the same start frames and speeds (the quote has 12 words instead of 10, so it finishes at local frame 73 instead of 66; still before the ornament at 75). No English-specific layout overrides were needed.

| Spanish | English |
|---|---|
| ¿Las cuentas / no cuadran? | Accounts don't / add up? |
| Ejemplo · datos ficticios | Example · fictitious data |
| Cuota Miembro A / B / Total | Member A fee / Member B fee / Total |
| ¿? (red mark) | ? |
| Familia que / ahorra junta, / prospera junta. | A family that / saves together, / prospers together. |
| Para quien no la conoce | If you're new to it |
| ¿Qué es una natillera? | What is a natillera? |
| Es como el marranito de la casa, pero de toda la familia. | It's like the piggy bank at home, but for the whole family. |
| Paso a paso | Step by step |
| Así funciona un mes / en la natillera | How a month works / in the natillera |
| Cada uno paga su cuota (Entra al fondo) | Everyone pays their fee (Into the fund) |
| La plata se presta adentro (Sale del fondo) | Money is lent within the group (Out of the fund) |
| Los intereses se reparten (Entra al fondo) | Interest is shared (Into the fund) |
| Vendemos juntos (Sale y vuelve con ganancia) | We sell together (Out and back with profit) |
| Todo queda anotado (Queda registrado) | Everything is recorded (Recorded) |
| Lo que ves cuando entras | What you see when you log in |
| Vistas previas · datos ficticios | Previews · fictitious data |
| Cuánto hay disponible (Disponible) | How much is available (Available) |
| Cuánto llevas ahorrado y ganado (Cuotas · Actividades · Intereses) | How much you've saved and earned (Fees · Activities · Interest) |
| Tus cuotas pendientes (1 cuota pendiente) | Your pending fees (1 pending fee) |
| Actividades y ranking de ventas (Miembro A/B/C) | Activities and sales ranking (Member A/B/C) |
| Cuentas claras. | Clear accounts. |
| Tu mensaje / Quiero unirme a la natillera | Your message / I want to join the natillera |
| Escribir por WhatsApp ↗ | Message us on WhatsApp ↗ |
