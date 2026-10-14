import type { CSSProperties, ReactNode } from 'react'
import { COLORS, SIZES } from '../theme'

type Props = { shadow?: number; style?: CSSProperties; children: ReactNode }

/** Ledger-style card: white, 2 px border, radius 30, offset shadow. */
export const PromoCard = ({ shadow = 12, style, children }: Props) => (
  <div
    style={{
      background: COLORS.white,
      border: `2px solid ${COLORS.border}`,
      borderRadius: SIZES.cardRadius,
      boxShadow: `${shadow}px ${shadow}px 0 0 ${COLORS.border}`,
      ...style,
    }}
  >
    {children}
  </div>
)
