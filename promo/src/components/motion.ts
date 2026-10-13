import { Easing, interpolate, spring } from 'remotion'

export const easeOut = Easing.out(Easing.cubic)

/** 0 -> 1 progress between two local frames, eased (out cubic by default). */
export const progress = (frame: number, start: number, end: number, easing = easeOut) =>
  interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })

/** Storyboard pop spring. */
export const pop = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } })

/** Opacity 1 -> 0 over the last `len` frames of a scene. */
export const fadeOut = (frame: number, duration: number, len = 10) =>
  interpolate(frame, [duration - len, duration - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
