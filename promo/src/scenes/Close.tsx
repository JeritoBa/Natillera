import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { FadeUp } from '../components/FadeUp'
import { Scene } from '../components/Scene'
import { Snout } from '../components/Snout'
import { SpringPop } from '../components/SpringPop'
import { progress } from '../components/motion'
import { useCopy } from '../lang'
import { useLayout } from '../layout'
import { COLORS, FONTS } from '../theme'

const pulseAt = (frame: number, start: number) =>
  interpolate(frame, [start, start + 10, start + 20], [1, 1.03, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

export const Close = () => {
  const frame = useCurrentFrame()
  const { close: C, safe: SAFE } = useLayout()
  const t = useCopy().close
  const slide = 1 - progress(frame, 0, 10)
  const buttonPulse = pulseAt(frame, 60) * pulseAt(frame, 90)

  return (
    <Scene background={COLORS.soft}>
      <div style={{ position: 'absolute', inset: 0, background: COLORS.primary, transform: `translateY(${slide * 100}%)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: C.watermark.left, top: C.watermark.top, opacity: 0.07 }}>
          <Snout size={C.watermark.size} white />
        </div>

        <FadeUp delay={8} duration={12} y={0} style={{ position: 'absolute', left: 0, right: 0, top: C.logoTop, display: 'flex', justifyContent: 'center' }}>
          <Img src={staticFile('logo-gallego-nanclares-invertido.png')} style={{ height: 120, width: 'auto' }} />
        </FadeUp>

        <SpringPop delay={15} from={0.92} style={{ position: 'absolute', left: SAFE.left - 60, width: SAFE.width + 120, top: C.titleTop, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 800, fontSize: C.titleSize, letterSpacing: '-0.03em', lineHeight: 1.02, color: COLORS.white, whiteSpace: 'nowrap' }}>
            {t.title}
          </div>
        </SpringPop>

        <SpringPop delay={30} from={1} translateX={40} style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: C.bubbleTop }}>
          <div
            style={{
              background: COLORS.white,
              borderRadius: '48px 48px 8px 48px',
              boxShadow: `8px 8px 0 0 ${COLORS.shadowDark}`,
              padding: C.bubblePadding,
            }}
          >
            <div style={{ fontFamily: FONTS.mono, fontWeight: 600, fontSize: 32, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted }}>
              {t.bubbleLabel}
            </div>
            <div style={{ marginTop: 14, fontFamily: FONTS.body, fontWeight: 500, fontSize: C.bubbleText, color: COLORS.text }}>{t.message}</div>
          </div>
        </SpringPop>

        <FadeUp delay={45} style={{ position: 'absolute', left: 0, right: 0, top: C.buttonTop, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              height: C.buttonHeight,
              padding: '0 56px',
              borderRadius: 20,
              background: COLORS.white,
              color: COLORS.primary,
              fontFamily: FONTS.body,
              fontWeight: 600,
              fontSize: C.buttonSize,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              transform: `scale(${buttonPulse})`,
            }}
          >
            {t.button}
          </div>
        </FadeUp>

        <FadeUp delay={52} style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: C.urlTop, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 500, fontSize: C.urlSize, color: COLORS.lightGreen }}>{t.url}</div>
        </FadeUp>
      </div>
    </Scene>
  )
}
