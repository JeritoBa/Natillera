import type { CSSProperties } from 'react'
import { Img, staticFile } from 'remotion'

type Props = { size: number; white?: boolean; style?: CSSProperties }

/** The favicon snout (vector fill, brand green); white via filter. Never recolored otherwise. */
export const Snout = ({ size, white = false, style }: Props) => (
  <Img
    src={staticFile('favicon.svg')}
    style={{ width: size, height: size, filter: white ? 'brightness(0) invert(1)' : undefined, ...style }}
  />
)
