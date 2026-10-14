// Single source of truth for colors, fonts, sizes and timing. Every hex in the project lives here.
export const COLORS = {
  primary: '#0c5c38',
  primaryHover: '#0a4e30',
  accent: '#117a45',
  text: '#0c1a12',
  muted: '#4e7460',
  page: '#f5f7f5',
  white: '#ffffff',
  secondary: '#ebf2ed',
  soft: '#eef4f0',
  border: '#d6e8dc',
  tint: '#f8fbf8',
  lightGreen: '#cfe8da',
  positiveBg: '#dcf5e8',
  positiveText: '#0a6635',
  pendingBg: '#fef6dc',
  pendingText: '#9a6e00',
  pendingNotice: '#7a5600',
  pendingBorder: '#f3dc9a',
  error: '#c0392b',
  // Chat-bubble offset shadow color (BRANDING: rgba(0,0,0,0.12)).
  shadowDark: 'rgba(0,0,0,0.12)',
} as const

export const FONTS = {
  heading: 'Outfit, sans-serif',
  body: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const

export const SIZES = {
  width: 1080,
  height: 1920,
  fps: 30,
  totalFrames: 900,
  cardRadius: 30,
  badgeRadius: 12,
  minText: 32,
} as const

// Safe area for text: y 250-1570, x 120-960.
export const SAFE = {
  top: 250,
  bottom: 1570,
  left: 120,
  right: 960,
  width: 840,
} as const

type SafeBox = { top: number; bottom: number; left: number; right: number; width: number }

const verticalLayout = {
  width: 1080,
  height: 1920,
  safe: SAFE as SafeBox,
  hook: {
    headTop: 300, headSize: 108, badgeTop: 640, cardTop: 740, cardPadding: '24px 48px',
    rowHeight: 120, labelSize: 44, amountSize: 52, markTop: 1230, markRight: 1080 - SAFE.right as number, markSize: 64,
  },
  brand: { ringTop: 740, ring: 440, snout: 320, logoTop: 420, taglineTop: 620, taglineSize: 100 },
  whatIs: {
    watermark: { size: 900, left: -240, top: 1000 },
    headTop: 360, h2Size: 80, quoteTop: 700, quoteSize: 72,
    ornamentLeft: SAFE.left as number, ornamentTop: 1220, ornament: 320, ornamentRing: 240, ornamentSnout: 140,
  },
  monthSteps: {
    headTop: 290, h2Size: 76, h2Margin: 16, ruleMargin: 28, rowsTop: 600, rowHeight: 190,
    circle: 128, icon: 84, gap: 32, titleSize: 48, tagMargin: 12,
  },
  memberViews: {
    grid: false, headTop: 270, h2Size: 76, badgeMargin: 18, cardsTop: 490, gap: 24, cardHeights: [230, 290, 195, 285],
    cardPadding: '24px 36px', titleIcon: 72, titleSize: 46, titleGap: 20, titleMinHeight: 72,
    availLabel: 36, availFigure: 64, availPadding: '14px 28px', savedFigure: 60, caption: 34,
    noticeSize: 40, noticePadding: '12px 24px', rankCircle: 52, rankGap: 20, rankText: 38, rankRowGap: 4,
  },
  close: {
    watermark: { size: 640, left: 640, top: 1500 },
    logoTop: 300, titleTop: 600, titleSize: 108, bubbleTop: 850, bubblePadding: '36px 48px', bubbleText: 44,
    buttonTop: 1150, buttonHeight: 120, buttonSize: 48, urlTop: 1330, urlSize: 44,
  },
}

export type Layout = typeof verticalLayout
export type Format = 'vertical' | 'square'

// Square 1:1 feed version: text safe area x 80-1000, y 80-1000.
export const SQUARE_SAFE = { top: 80, bottom: 1000, left: 80, right: 1000, width: 920 } as const

const squareLayout: Layout = {
  width: 1080,
  height: 1080,
  safe: SQUARE_SAFE as SafeBox,
  hook: {
    headTop: 180, headSize: 88, badgeTop: 380, cardTop: 490, cardPadding: '16px 40px',
    rowHeight: 96, labelSize: 40, amountSize: 48, markTop: 835, markRight: 1080 - SQUARE_SAFE.right, markSize: 64,
  },
  brand: { ringTop: 375, ring: 330, snout: 240, logoTop: 323, taglineTop: 479, taglineSize: 88 },
  whatIs: {
    watermark: { size: 700, left: -200, top: 500 },
    headTop: 190, h2Size: 68, quoteTop: 380, quoteSize: 60,
    ornamentLeft: 760, ornamentTop: 760, ornament: 240, ornamentRing: 180, ornamentSnout: 105,
  },
  monthSteps: {
    headTop: 80, h2Size: 60, h2Margin: 10, ruleMargin: 14, rowsTop: 290, rowHeight: 140,
    circle: 96, icon: 64, gap: 28, titleSize: 42, tagMargin: 8,
  },
  memberViews: {
    grid: true, headTop: 80, h2Size: 60, badgeMargin: 14, cardsTop: 240, gap: 20, cardHeights: [370, 370, 330, 330],
    cardPadding: '20px 20px', titleIcon: 56, titleSize: 36, titleGap: 14, titleMinHeight: 80,
    availLabel: 32, availFigure: 48, availPadding: '14px 20px', savedFigure: 48, caption: 32,
    noticeSize: 36, noticePadding: '10px 20px', rankCircle: 44, rankGap: 10, rankText: 32, rankRowGap: 4,
  },
  close: {
    watermark: { size: 520, left: 640, top: 830 },
    logoTop: 202, titleTop: 362, titleSize: 96, bubbleTop: 500, bubblePadding: '28px 40px', bubbleText: 40,
    buttonTop: 694, buttonHeight: 100, buttonSize: 44, urlTop: 830, urlSize: 40,
  },
}

export const LAYOUTS: Record<Format, Layout> = { vertical: verticalLayout, square: squareLayout }

// Music: measured ~135 BPM (see README). That is outside the accepted 100-128 range, so the
// storyboard target of 120 BPM and offset 0 are kept and the nominal cuts are not recomputed.
export const BPM = 120
export const MUSIC_OFFSET_FRAMES = 0
export const BEAT = Math.round((60 / BPM) * SIZES.fps) // 15 frames

export const beatFrame = (n: number) => Math.round(MUSIC_OFFSET_FRAMES + (n * 1800) / BPM)

export type SceneName = 'hook' | 'brand' | 'whatIs' | 'monthSteps' | 'memberViews' | 'close'

const range = (from: number, to: number) => ({ from, durationInFrames: to - from })

// Cuts at 120, 240, 390, 600, 780 (= beats 8, 16, 26, 40, 52 at 120 BPM).
export const SCENES: Record<SceneName, { from: number; durationInFrames: number }> = {
  hook: range(0, beatFrame(8)),
  brand: range(beatFrame(8), beatFrame(16)),
  whatIs: range(beatFrame(16), beatFrame(26)),
  monthSteps: range(beatFrame(26), beatFrame(40)),
  memberViews: range(beatFrame(40), beatFrame(52)),
  close: range(beatFrame(52), SIZES.totalFrames),
}

export const MUSIC_VOLUME = 0.8
