import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { progress } from './motion'

type Props = { delay?: number; y?: number; duration?: number; style?: CSSProperties; children: ReactNode }

/** Standard fadeUp: opacity 0 -> 1 and translateY 24 -> 0 over 10 frames. */
export const FadeUp = ({ delay = 0, y = 24, duration = 10, style, children }: Props) => {
  const p = progress(useCurrentFrame(), delay, delay + duration)
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style }}>{children}</div>
}
