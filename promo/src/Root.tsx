import { Composition } from 'remotion'
import './fonts'
import './promo.css'
import { Promo, type PromoProps } from './Promo'
import { LAYOUTS, SIZES } from './theme'

const defaultProps: PromoProps = { showSafeAreas: false }

const squareProps: PromoProps = { showSafeAreas: false, format: 'square' }

const squareEnProps: PromoProps = { showSafeAreas: false, format: 'square', lang: 'en' }

export const RemotionRoot = () => (
  <>
    <Composition
      id="NatilleraPromo"
      component={Promo}
      width={SIZES.width}
      height={SIZES.height}
      fps={SIZES.fps}
      durationInFrames={SIZES.totalFrames}
      defaultProps={defaultProps}
    />
    <Composition
      id="NatilleraPromoSquare"
      component={Promo}
      width={LAYOUTS.square.width}
      height={LAYOUTS.square.height}
      fps={SIZES.fps}
      durationInFrames={SIZES.totalFrames}
      defaultProps={squareProps}
    />
    <Composition
      id="NatilleraPromoSquareEn"
      component={Promo}
      width={LAYOUTS.square.width}
      height={LAYOUTS.square.height}
      fps={SIZES.fps}
      durationInFrames={SIZES.totalFrames}
      defaultProps={squareEnProps}
    />
  </>
)
