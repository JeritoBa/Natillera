import { AbsoluteFill } from 'remotion'
import { useLayout } from '../layout'

/** Debug overlay: marks the text safe area (per-format text safe area) and dims everything outside it. */
export const SafeAreaOverlay = () => {
  const { safe: SAFE, height } = useLayout()
  return (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        top: SAFE.top,
        width: SAFE.width,
        height: SAFE.bottom - SAFE.top,
        border: '3px solid magenta',
        boxShadow: `0 0 0 ${height}px rgba(255,0,255,0.12)`,
      }}
    />
  </AbsoluteFill>
  )
}
