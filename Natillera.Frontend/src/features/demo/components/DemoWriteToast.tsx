import { useEffect, useRef, useState } from 'react'
import { DEMO_NOTICE, DEMO_WRITE_EVENT } from '@/features/demo/model/demoSession'
import { Icon } from '@/shared/ui/Icon'

const VISIBLE_MS = 4000

// DEMO-04: shown when a write is attempted in demo mode (the form has already closed).
export function DemoWriteToast() {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const show = () => {
      window.clearTimeout(timer.current)
      setVisible(true)
      timer.current = window.setTimeout(() => setVisible(false), VISIBLE_MS)
    }
    window.addEventListener(DEMO_WRITE_EVENT, show)
    return () => {
      window.removeEventListener(DEMO_WRITE_EVENT, show)
      window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 left-0 right-0 z-[60] flex justify-center px-4">
      {visible && (
        <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg bg-[#0c5c38] px-4 py-3 text-sm text-white shadow-lg">
          <span>{DEMO_NOTICE}</span>
          <button type="button" onClick={() => setVisible(false)} aria-label="Cerrar aviso" className="inline-flex min-h-8 min-w-8 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <Icon.X />
          </button>
        </div>
      )}
    </div>
  )
}
