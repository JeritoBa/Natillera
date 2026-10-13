import { useCurrentFrame } from 'remotion'
import { FadeUp } from '../components/FadeUp'
import { PromoBadge } from '../components/PromoBadge'
import { PromoCard } from '../components/PromoCard'
import { Scene } from '../components/Scene'
import { SpringPop } from '../components/SpringPop'
import { WordReveal } from '../components/WordReveal'
import { fadeOut, progress } from '../components/motion'
import { useCopy } from '../lang'
import { useLayout } from '../layout'
import { COLORS, FONTS, SCENES } from '../theme'

type NoteRowProps = { label: string; amount: string; start: number; bold?: boolean; strike?: number }

/** One line of the fake note: label and amount "type in" at 1 character per frame. */
const NoteRow = ({ label, amount, start, bold = false, strike }: NoteRowProps) => {
  const frame = useCurrentFrame()
  const { hook: H } = useLayout()
  const typed = Math.max(0, Math.floor(frame - start))
  const labelShown = label.slice(0, typed)
  const amountShown = typed > label.length ? amount.slice(0, typed - label.length) : ''
  const strikeP = strike === undefined ? 0 : progress(frame, strike, strike + 8)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: H.rowHeight }}>
      <span style={{ fontFamily: FONTS.body, fontSize: H.labelSize, fontWeight: bold ? 600 : 400, color: COLORS.text }}>
        {labelShown}
        <span style={{ visibility: 'hidden' }}>{label.slice(labelShown.length)}</span>
      </span>
      <span style={{ position: 'relative', fontFamily: FONTS.mono, fontWeight: 600, fontSize: H.amountSize, color: COLORS.text, fontVariantNumeric: 'tabular-nums' }}>
        {amountShown}
        <span style={{ visibility: 'hidden' }}>{amount.slice(amountShown.length)}</span>
        {strike !== undefined ? (
          <span
            style={{
              position: 'absolute',
              left: -12,
              top: '50%',
              height: 4,
              width: `calc(${strikeP * 100}% + 24px)`,
              maxWidth: 'calc(100% + 24px)',
              background: COLORS.error,
              transform: 'translateY(-50%)',
            }}
          />
        ) : null}
      </span>
    </div>
  )
}

export const Hook = () => {
  const frame = useCurrentFrame()
  const { hook: H, safe: SAFE } = useLayout()
  const t = useCopy().hook
  const duration = SCENES.hook.durationInFrames
  const exit = progress(frame, duration - 10, duration - 1)
  const opacity = fadeOut(frame, duration)

  return (
    <Scene background={COLORS.page}>
      <div style={{ position: 'absolute', inset: 0, opacity, transform: `translateY(${-80 * exit}px)` }}>
        <div style={{ position: 'absolute', left: SAFE.left, top: H.headTop, width: SAFE.width }}>
          <WordReveal
            text={t.line1}
            stagger={2}
            style={{ fontFamily: FONTS.heading, fontWeight: 800, fontSize: H.headSize, letterSpacing: '-0.03em', lineHeight: 1.02, color: COLORS.text }}
          />
          <WordReveal
            text={t.line2}
            delay={4}
            stagger={2}
            style={{ fontFamily: FONTS.heading, fontWeight: 800, fontSize: H.headSize, letterSpacing: '-0.03em', lineHeight: 1.02, color: COLORS.text }}
          />
        </div>

        <FadeUp delay={12} style={{ position: 'absolute', left: SAFE.left, top: H.badgeTop }}>
          <PromoBadge>{t.badge}</PromoBadge>
        </FadeUp>

        <SpringPop delay={10} from={1} translateY={60} style={{ position: 'absolute', left: SAFE.left, top: H.cardTop, width: SAFE.width }}>
          <PromoCard style={{ padding: H.cardPadding }}>
            <NoteRow label={t.rows[0]} amount="100.000" start={25} />
            <div style={{ height: 2, background: COLORS.soft }} />
            <NoteRow label={t.rows[1]} amount="100.000" start={40} />
            <div style={{ height: 2, background: COLORS.soft }} />
            <NoteRow label={t.rows[2]} amount="250.000" start={55} bold strike={75} />
          </PromoCard>
        </SpringPop>

        <SpringPop
          delay={85}
          from={0.4}
          rotateFrom={-6}
          style={{ position: 'absolute', right: H.markRight, top: H.markTop, fontFamily: FONTS.heading, fontWeight: 800, fontSize: H.markSize, color: COLORS.error }}
        >
          {t.mark}
        </SpringPop>
      </div>
    </Scene>
  )
}
