import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { progress } from './motion'

type Props = {
  value: number
  format: (n: number) => string
  delay?: number
  duration?: number
  style?: CSSProperties
}

/** Counts 0 -> value (rounded to thousands while counting, exact at the end) in a fixed-width box. */
export const CountUp = ({ value, format, delay = 0, duration = 30, style }: Props) => {
  const frame = useCurrentFrame()
  const p = progress(frame, delay, delay + duration)
  const shown = p >= 1 ? value : Math.round((value * p) / 1000) * 1000
  return (
    <span style={{ display: 'inline-grid', fontVariantNumeric: 'tabular-nums', ...style }}>
      <span style={{ gridArea: '1 / 1', visibility: 'hidden' }}>{format(value)}</span>
      <span style={{ gridArea: '1 / 1', textAlign: 'right' }}>{format(shown)}</span>
    </span>
  )
}
