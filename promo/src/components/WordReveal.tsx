import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { progress } from './motion'

type Props = { text: string; delay?: number; stagger?: number; duration?: number; style?: CSSProperties }

/** Word-by-word fadeUp. */
export const WordReveal = ({ text, delay = 0, stagger = 3, duration = 10, style }: Props) => {
  const frame = useCurrentFrame()
  const words = text.split(' ')
  return (
    <div style={style}>
      {words.map((word, i) => {
        const p = progress(frame, delay + i * stagger, delay + i * stagger + duration)
        return (
          <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 24}px)`, whiteSpace: 'pre' }}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </div>
  )
}
