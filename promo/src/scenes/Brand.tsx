import { Easing, Img, staticFile, useCurrentFrame } from 'remotion'
import { FadeUp } from '../components/FadeUp'
import { Scene } from '../components/Scene'
import { Snout } from '../components/Snout'
import { SpringPop } from '../components/SpringPop'
import { fadeOut, progress } from '../components/motion'
import { useCopy } from '../lang'
import { useLayout } from '../layout'
import { COLORS, FONTS, SCENES } from '../theme'

const tagline = {
  fontFamily: FONTS.heading,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.05,
  textAlign: 'center',
  whiteSpace: 'nowrap',
} as const

export const Brand = () => {
  const frame = useCurrentFrame()
  const { brand: B, safe: SAFE } = useLayout()
  const t = useCopy().brand
  const duration = SCENES.brand.durationInFrames
  const ringRotate = (frame / duration) * 20
  const markOut = 1 - progress(frame, 30, 40)
  const wipe = progress(frame, 30, 45, Easing.inOut(Easing.cubic))

  return (
    <Scene background={COLORS.page}>
      <div style={{ position: 'absolute', inset: 0, opacity: fadeOut(frame, duration) }}>
        {/* Snout inside the landing's dashed ring */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: B.ringTop, display: 'flex', justifyContent: 'center', opacity: markOut }}>
          <SpringPop from={0.6} style={{ position: 'relative', width: B.ring, height: B.ring, display: 'grid', placeItems: 'center' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `4px dashed ${COLORS.primary}`,
                opacity: 0.35,
                transform: `rotate(${ringRotate}deg)`,
              }}
            />
            <Snout size={B.snout} />
          </SpringPop>
        </div>

        {/* Horizontal logo, wipes in from the left */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: B.logoTop, display: 'flex', justifyContent: 'center' }}>
          <Img
            src={staticFile('logo-gallego-nanclares.png')}
            style={{ height: 120, width: 'auto', clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}
          />
        </div>

        <div style={{ position: 'absolute', left: SAFE.left - 60, width: SAFE.width + 120, top: B.taglineTop }}>
          <FadeUp delay={45}>
            <div style={{ ...tagline, fontSize: B.taglineSize, color: COLORS.text }}>{t.lines[0]}</div>
          </FadeUp>
          <FadeUp delay={52}>
            <div style={{ ...tagline, fontSize: B.taglineSize, color: COLORS.text }}>{t.lines[1]}</div>
          </FadeUp>
          <SpringPop delay={60} from={0.96}>
            <div style={{ ...tagline, fontSize: B.taglineSize, color: COLORS.primary }}>{t.lines[2]}</div>
          </SpringPop>
        </div>
      </div>
    </Scene>
  )
}
