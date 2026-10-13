import type { CSSProperties } from 'react'
import { COLORS, FONTS, SIZES } from '../theme'

type Tone = 'neutral' | 'positive'
const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: COLORS.soft, fg: COLORS.muted },
  positive: { bg: COLORS.positiveBg, fg: COLORS.positiveText },
}

type Props = { tone?: Tone; style?: CSSProperties; children: string }

/** Uppercase mono pill (32 px, tracking 0.04em). */
export const PromoBadge = ({ tone = 'neutral', style, children }: Props) => (
  <span
    style={{
      display: 'inline-block',
      background: TONES[tone].bg,
      color: TONES[tone].fg,
      fontFamily: FONTS.mono,
      fontWeight: 600,
      fontSize: SIZES.minText,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      borderRadius: SIZES.badgeRadius,
      padding: '10px 20px',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
)
