import type { ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { CountUp } from '../components/CountUp'
import { DrawIcon, type IconName } from '../components/DrawIcon'
import { FadeUp } from '../components/FadeUp'
import { PromoBadge } from '../components/PromoBadge'
import { PromoCard } from '../components/PromoCard'
import { Scene } from '../components/Scene'
import { fadeOut, progress } from '../components/motion'
import { formatCurrency } from '@app/shared/lib/formatters'
import { useCopy } from '../lang'
import { useLayout } from '../layout'
import { COLORS, FONTS, SCENES } from '../theme'

const CARD_START = [20, 44, 68, 92]

const CardTitle = ({ icon, start, children }: { icon: IconName; start: number; children: string }) => {
  const { memberViews: V } = useLayout()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: V.titleGap, minHeight: V.titleMinHeight }}>
      <div style={{ flex: 'none' }}>
        <DrawIcon name={icon} size={V.titleIcon} start={start + 4} />
      </div>
      <div style={{ fontFamily: FONTS.heading, fontWeight: 600, fontSize: V.titleSize, lineHeight: 1.1, color: COLORS.text }}>{children}</div>
    </div>
  )
}

const Card = ({ index, children }: { index: number; children: ReactNode }) => {
  const { memberViews: V } = useLayout()
  return (
    <FadeUp delay={CARD_START[index]} y={40} duration={12}>
      <PromoCard style={{ height: V.cardHeights[index], padding: V.cardPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {children}
      </PromoCard>
    </FadeUp>
  )
}

const RANKING_AMOUNTS = [120000, 95000, 70000]

const SEGMENTS = [
  { width: 88, color: COLORS.primary },
  { width: 7, color: COLORS.accent },
  { width: 5, color: COLORS.lightGreen },
]

export const MemberViews = () => {
  const frame = useCurrentFrame()
  const { memberViews: V, safe: SAFE } = useLayout()
  const t = useCopy().memberViews
  const ranking = t.ranking.names.map((name, i) => ({ name, amount: RANKING_AMOUNTS[i] }))
  const duration = SCENES.memberViews.durationInFrames
  const count = (index: number) => CARD_START[index] + 10
  // Notice pulse 1 -> 1.04 -> 1 at local 120.
  const pulse = interpolate(frame, [120, 130, 140], [1, 1.04, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Scene background={COLORS.soft}>
      <div style={{ position: 'absolute', inset: 0, opacity: fadeOut(frame, duration) }}>
        <div style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: V.headTop }}>
          <FadeUp delay={0} duration={12}>
            <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: V.h2Size, letterSpacing: '-0.02em', lineHeight: 1.1, color: COLORS.text }}>
              {t.h2}
            </div>
          </FadeUp>
          <FadeUp delay={4} duration={12} style={{ marginTop: V.badgeMargin }}>
            <PromoBadge>{t.badge}</PromoBadge>
          </FadeUp>
        </div>

        <div style={{ position: 'absolute', left: SAFE.left, width: SAFE.width,
            top: V.cardsTop,
            ...(V.grid
              ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: V.gap }
              : { display: 'flex', flexDirection: 'column', gap: V.gap }),
          }}>
          <Card index={0}>
            <CardTitle icon="Caja" start={CARD_START[0]}>{t.available.title}</CardTitle>
            <div
              style={{
                background: COLORS.primary,
                borderRadius: 20,
                padding: V.availPadding,
                display: 'flex',
                flexDirection: V.grid ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: V.grid ? 'flex-start' : 'center',
              }}
            >
              <span style={{ fontFamily: FONTS.body, fontSize: V.availLabel, color: COLORS.lightGreen }}>{t.available.label}</span>
              <CountUp
                value={2350000}
                format={formatCurrency}
                delay={count(0)}
                style={{ fontFamily: FONTS.mono, fontWeight: 600, fontSize: V.availFigure, color: COLORS.white }}
              />
            </div>
          </Card>

          <Card index={1}>
            <CardTitle icon="Ahorro" start={CARD_START[1]}>{t.saved.title}</CardTitle>
            <div>
              <CountUp
                value={1240000}
                format={formatCurrency}
                delay={count(1)}
                style={{ fontFamily: FONTS.mono, fontWeight: 600, fontSize: V.savedFigure, color: COLORS.positiveText }}
              />
            </div>
            <div style={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', background: COLORS.soft }}>
              {SEGMENTS.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    width: `${seg.width * progress(frame, count(1) + i * 4, count(1) + i * 4 + 24)}%`,
                    background: seg.color,
                  }}
                />
              ))}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: V.caption, color: COLORS.muted }}>{t.saved.caption}</div>
          </Card>

          <Card index={2}>
            <CardTitle icon="Aviso" start={CARD_START[2]}>{t.pending.title}</CardTitle>
            <div
              style={{
                background: COLORS.pendingBg,
                border: `2px solid ${COLORS.pendingBorder}`,
                borderRadius: 16,
                padding: V.noticePadding,
                fontFamily: FONTS.body,
                fontWeight: 500,
                fontSize: V.noticeSize,
                color: COLORS.pendingNotice,
                transform: `scale(${pulse})`,
                transformOrigin: 'left center',
              }}
            >
              {t.pending.notice}
            </div>
          </Card>

          <Card index={3}>
            <CardTitle icon="Trofeo" start={CARD_START[3]}>{t.ranking.title}</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: V.rankRowGap }}>
              {ranking.map((row, i) => (
                <FadeUp key={row.name} delay={count(3) + i * 6} duration={10}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: V.rankGap, height: V.rankCircle }}>
                    <span
                      style={{
                        width: V.rankCircle,
                        height: V.rankCircle,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: FONTS.mono,
                        fontWeight: 600,
                        fontSize: 32,
                        background: i === 0 ? COLORS.primary : COLORS.positiveBg,
                        color: i === 0 ? COLORS.white : COLORS.positiveText,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontFamily: FONTS.body, fontSize: V.rankText, color: COLORS.text }}>{row.name}</span>
                    <CountUp
                      value={row.amount}
                      format={formatCurrency}
                      delay={count(3) + i * 6}
                      style={{ fontFamily: FONTS.mono, fontWeight: 600, fontSize: V.rankText, color: COLORS.text }}
                    />
                  </div>
                </FadeUp>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Scene>
  )
}
