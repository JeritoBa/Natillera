import { useCurrentFrame, useVideoConfig } from 'remotion'
import { DrawIcon, type IconName } from '../components/DrawIcon'
import { Eyebrow } from '../components/Eyebrow'
import { FadeUp } from '../components/FadeUp'
import { PromoBadge } from '../components/PromoBadge'
import { Scene } from '../components/Scene'
import { fadeOut, pop } from '../components/motion'
import { useCopy } from '../lang'
import { useLayout } from '../layout'
import { COLORS, FONTS, SCENES } from '../theme'

type Step = { icon: IconName; positive: boolean }

const STEPS: Step[] = [
  { icon: 'Cuota', positive: true },
  { icon: 'Presta', positive: false },
  { icon: 'Reparto', positive: true },
  { icon: 'Venta', positive: false },
  { icon: 'Libreta', positive: false },
]

const Row = ({ step, index }: { step: Step; index: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { monthSteps: M } = useLayout()
  const { title, tag } = useCopy().monthSteps.steps[index]
  const start = 30 + index * 30
  const circle = pop(frame, fps, start)
  const tagPop = pop(frame, fps, start + 8)

  return (
    <div
      style={{
        height: M.rowHeight,
        display: 'flex',
        alignItems: 'center',
        gap: M.gap,
        borderBottom: index < STEPS.length - 1 ? `2px solid ${COLORS.border}` : 'none',
      }}
    >
      <div
        style={{
          flex: 'none',
          width: M.circle,
          height: M.circle,
          borderRadius: '50%',
          background: COLORS.secondary,
          display: 'grid',
          placeItems: 'center',
          transform: `scale(${circle})`,
        }}
      >
        <DrawIcon name={step.icon} size={M.icon} start={start} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <FadeUp delay={start + 4}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 600, fontSize: M.titleSize, lineHeight: 1.15, color: COLORS.text, whiteSpace: 'nowrap' }}>
            {title}
          </div>
        </FadeUp>
        <div style={{ marginTop: M.tagMargin, opacity: Math.min(1, tagPop), transform: `scale(${0.8 + 0.2 * tagPop})`, transformOrigin: 'left center' }}>
          <PromoBadge tone={step.positive ? 'positive' : 'neutral'}>{tag}</PromoBadge>
        </div>
      </div>
    </div>
  )
}

export const MonthSteps = () => {
  const frame = useCurrentFrame()
  const { monthSteps: M, safe: SAFE } = useLayout()
  const t = useCopy().monthSteps
  return (
    <Scene background={COLORS.page}>
      <div style={{ position: 'absolute', inset: 0, opacity: fadeOut(frame, SCENES.monthSteps.durationInFrames) }}>
        <div style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: M.headTop }}>
          <FadeUp delay={0}>
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </FadeUp>
          <FadeUp delay={5} style={{ marginTop: M.h2Margin }}>
            <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: M.h2Size, letterSpacing: '-0.02em', lineHeight: 1.1, color: COLORS.text }}>
              {t.h2[0]}
              <br />
              {t.h2[1]}
            </div>
            <div style={{ marginTop: M.ruleMargin, height: 2, background: COLORS.text }} />
          </FadeUp>
        </div>
        <div style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: M.rowsTop }}>
          {STEPS.map((step, i) => (
            <Row key={step.icon} step={step} index={i} />
          ))}
        </div>
      </div>
    </Scene>
  )
}

