import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { pop } from './motion'

type Props = {
  delay?: number
  from?: number
  rotateFrom?: number
  translateX?: number
  translateY?: number
  fade?: boolean
  style?: CSSProperties
  children: ReactNode
}

/** Spring-in (scale, optional rotation / offset) using the storyboard pop spring. */
export const SpringPop = ({ delay = 0, from = 0.8, rotateFrom = 0, translateX = 0, translateY = 0, fade = true, style, children }: Props) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = pop(frame, fps, delay)
  const scale = from + (1 - from) * s
  return (
    <div
      style={{
        opacity: fade ? Math.min(1, Math.max(0, s * 2)) : 1,
        transform: `translate(${(1 - s) * translateX}px, ${(1 - s) * translateY}px) rotate(${(1 - s) * rotateFrom}deg) scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
