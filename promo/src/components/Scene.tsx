import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'

type Props = { background: string; style?: CSSProperties; children: ReactNode }

export const Scene = ({ background, style, children }: Props) => (
  <AbsoluteFill style={{ background, overflow: 'hidden', ...style }}>{children}</AbsoluteFill>
)
