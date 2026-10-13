import type { ComponentType } from 'react'
import { useCurrentFrame } from 'remotion'
import { LandingIcon } from '@app/features/landing/components/LandingIcons'
import { COLORS } from '../theme'
import { progress } from './motion'

export type IconName = keyof typeof LandingIcon

type Props = { name: IconName; size: number; start?: number; drawFrames?: number; color?: string }

/** Draws the stroke of the app LandingIcon (dashoffset 120 -> 0), then fades in the accent fill. */
export const DrawIcon = ({ name, size, start = 0, drawFrames = 18, color = COLORS.primary }: Props) => {
  const frame = useCurrentFrame()
  const Icon = LandingIcon[name] as ComponentType<{ className?: string }>
  const draw = 120 * (1 - progress(frame, start, start + drawFrames))
  const fill = progress(frame, start + drawFrames - 8, start + drawFrames)
  return (
    <div className="draw" style={{ width: size, height: size, color, ['--draw' as string]: draw, ['--fill' as string]: fill }}>
      <Icon className="" />
    </div>
  )
}
