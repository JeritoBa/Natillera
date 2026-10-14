import { useCurrentFrame } from 'remotion'
import { Eyebrow } from '../components/Eyebrow'
import { FadeUp } from '../components/FadeUp'
import { Scene } from '../components/Scene'
import { Snout } from '../components/Snout'
import { SpringPop } from '../components/SpringPop'
import { WordReveal } from '../components/WordReveal'
import { useCopy } from '../lang'
import { useLayout } from '../layout'
import { COLORS, FONTS, SCENES } from '../theme'

export const WhatIs = () => {
  const frame = useCurrentFrame()
  const { whatIs: W, safe: SAFE } = useLayout()
  const t = useCopy().whatIs
  const drift = (frame / SCENES.whatIs.durationInFrames) * 40

  return (
    <Scene background={COLORS.white}>
      {/* Decorative watermark: 900 px snout at x -240, bottom edge at y 1900, drifting up */}
      <div style={{ position: 'absolute', left: W.watermark.left, top: W.watermark.top, opacity: 0.06, transform: `translateY(${-drift}px)` }}>
        <Snout size={W.watermark.size} />
      </div>

      <div style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: W.headTop }}>
        <FadeUp delay={0}>
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </FadeUp>
        <FadeUp delay={6} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: W.h2Size, letterSpacing: '-0.02em', lineHeight: 1.1, color: COLORS.text }}>
            {t.h2}
          </div>
        </FadeUp>
      </div>

      <div style={{ position: 'absolute', left: SAFE.left, width: SAFE.width, top: W.quoteTop, borderLeft: `12px solid ${COLORS.primary}`, paddingLeft: 48 }}>
        <WordReveal
          text={t.quote}
          delay={30}
          stagger={3}
          style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: W.quoteSize, lineHeight: 1.2, color: COLORS.primary }}
        />
      </div>

      <div style={{ position: 'absolute', left: W.ornamentLeft, top: W.ornamentTop }}>
        <SpringPop delay={75} from={0} rotateFrom={-8}>
          <div
            style={{
              position: 'relative',
              width: W.ornament,
              height: W.ornament,
              borderRadius: '50%',
              background: COLORS.white,
              border: `2px solid ${COLORS.border}`,
              boxShadow: `12px 12px 0 0 ${COLORS.border}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div style={{ position: 'absolute', width: W.ornamentRing, height: W.ornamentRing, borderRadius: '50%', border: `4px dashed ${COLORS.primary}`, opacity: 0.35 }} />
            <Snout size={W.ornamentSnout} />
          </div>
        </SpringPop>
      </div>
    </Scene>
  )
}
