import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion'
import { SafeAreaOverlay } from './components/SafeAreaOverlay'
import { Brand } from './scenes/Brand'
import { Close } from './scenes/Close'
import { Hook } from './scenes/Hook'
import { MemberViews } from './scenes/MemberViews'
import { MonthSteps } from './scenes/MonthSteps'
import { WhatIs } from './scenes/WhatIs'
import { LangProvider } from './lang'
import { LayoutProvider } from './layout'
import type { Lang } from './copy'
import { COLORS, MUSIC_VOLUME, SCENES, SIZES, type Format } from './theme'

export type PromoProps = { showSafeAreas: boolean; format?: Format; lang?: Lang }

const volume = (frame: number) =>
  interpolate(frame, [0, 6, 870, SIZES.totalFrames - 1], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

export const Promo = ({ showSafeAreas, format = 'vertical', lang = 'es' }: PromoProps) => (
  <LangProvider lang={lang}>
  <LayoutProvider format={format}>
  <AbsoluteFill style={{ backgroundColor: COLORS.page }}>
    <Audio src={staticFile('music.mp3')} volume={volume} />
    <Sequence {...SCENES.hook} name="Hook">
      <Hook />
    </Sequence>
    <Sequence {...SCENES.brand} name="Brand">
      <Brand />
    </Sequence>
    <Sequence {...SCENES.whatIs} name="WhatIs">
      <WhatIs />
    </Sequence>
    <Sequence {...SCENES.monthSteps} name="MonthSteps">
      <MonthSteps />
    </Sequence>
    <Sequence {...SCENES.memberViews} name="MemberViews">
      <MemberViews />
    </Sequence>
    <Sequence {...SCENES.close} name="Close">
      <Close />
    </Sequence>
    {showSafeAreas ? <SafeAreaOverlay /> : null}
  </AbsoluteFill>
  </LayoutProvider>
  </LangProvider>
)
