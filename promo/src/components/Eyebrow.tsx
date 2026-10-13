import type { CSSProperties } from 'react'
import { COLORS, FONTS, SIZES } from '../theme'

export const Eyebrow = ({ children, style }: { children: string; style?: CSSProperties }) => (
  <div
    style={{
      fontFamily: FONTS.mono,
      fontWeight: 600,
      fontSize: SIZES.minText,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: COLORS.muted,
      ...style,
    }}
  >
    {children}
  </div>
)
