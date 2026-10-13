# Natillera promo video (Remotion)

30 s promo, vertical 9:16 (`NatilleraPromo`, 1080x1920), square 1:1 (`NatilleraPromoSquare`, 1080x1080) and an English square 1:1 (`NatilleraPromoSquareEn`, 1080x1080), all 30 fps, 900 frames, that invites family members to join the natillera. Spec: [STORYBOARD.md](STORYBOARD.md). Brand standard: [../docs/BRANDING.md](../docs/BRANDING.md). All figures on screen are fictitious.

Independent from the app: it has its own `package.json`. It only *reads* two small app files through the webpack alias `@app` (see `remotion.config.ts` and `tsconfig.json`):

- `Natillera.Frontend/src/features/landing/components/LandingIcons.tsx` (`LandingIcon`)
- `Natillera.Frontend/src/shared/lib/formatters.ts` (`formatCurrency`)

React is forced to the copy in `promo/node_modules` so the app files and the video share one React.

## Run

```bash
cd promo
npm install
npm run studio        # Remotion Studio (preview, scrub, toggle showSafeAreas prop)
npm run typecheck     # tsc --noEmit
npm run still         # thumbnail -> out/thumbnail.png (frame 225)
npm run render        # out/natillera-promo.mp4 (h264, crf 18)
npm run still:square  # square thumbnail -> out/thumbnail-square.png (frame 225)
npm run render:square # out/natillera-promo-square.mp4 (1080x1080, h264, crf 18)
npm run still:square:en  # English square thumbnail -> out/thumbnail-square-en.png (frame 225)
npm run render:square:en # out/natillera-promo-square-en.mp4 (1080x1080, h264, crf 18)
npx remotion still src/index.ts NatilleraPromo out/f700.png --frame=700 --props='{"showSafeAreas":true}'
```

Fonts (Outfit, Inter, JetBrains Mono) are loaded from Google Fonts at render time, so the first render needs internet access. `out/` is git-ignored.

## Formats

Both compositions use the same `Promo` component, audio, scenes, timings and copy. The `format` prop (`'vertical' | 'square'`) selects `LAYOUTS[format]` from `src/theme.ts` through a React context (`src/layout.tsx`, `useLayout()`); scenes read sizes and positions from it. Vertical values are the approved ones and must not change. Square text safe area: x 80-1000, y 80-1000.

## Languages

The `lang` prop (`'es' | 'en'`, default `'es'`) selects `COPY[lang]` from `src/copy.ts` through a React context (`src/lang.tsx`, `useCopy()`). All on-screen strings live in `COPY`; numbers, logos, the URL and the word "natillera" are shared. `NatilleraPromoSquareEn` = square layout + `lang: 'en'`; Spanish compositions are pixel-identical to before the refactor.

## Structure

- `src/copy.ts`: `COPY.es` / `COPY.en` strings. `src/lang.tsx`: `LangProvider` / `useCopy`.

- `src/layout.tsx`: `LayoutProvider` / `useLayout` (per-format layout context).
- `src/theme.ts`: colors, fonts, sizes, safe area, BPM, scene frame ranges (the only place with hex colors).
- `src/Promo.tsx`: audio (volume envelope) and scene sequences. `src/scenes/`: Hook, Brand, WhatIs, MonthSteps, MemberViews, Close.
- `src/components/`: FadeUp, WordReveal, CountUp, SpringPop, DrawIcon, PromoCard, PromoBadge, Eyebrow, Snout, Scene, SafeAreaOverlay.
- `public/`: `favicon.svg` and the two logo PNGs (copied unchanged from `Natillera.Frontend/public/`), `music.mp3`.

## Music

"Ukulele Fun Acoustic Background (Happy Strings)" by NRA-LAB, Pixabay Content License, not Content ID registered. License record: [public/MUSIC-LICENSE.md](public/MUSIC-LICENSE.md). Measured tempo is about 135 BPM, outside the 100-128 range of the storyboard's re-timing rule, so the nominal 120 BPM grid and cuts (120, 240, 390, 600, 780) are kept.
