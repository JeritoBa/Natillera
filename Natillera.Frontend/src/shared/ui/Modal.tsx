import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '@/shared/ui/Icon'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  describedBy?: string
  role?: 'dialog' | 'alertdialog'
  busy?: boolean
}

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ title, onClose, children, describedBy, role = 'dialog', busy }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = bodyRef.current?.querySelector<HTMLElement>(focusableSelector)
    ;(first ?? panelRef.current)?.focus()
    return () => { if (previous && document.contains(previous)) previous.focus() }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onCloseRef.current()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector))
    if (items.length === 0) { event.preventDefault(); panelRef.current.focus(); return }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panelRef.current)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-busy={busy || undefined}
        tabIndex={-1}
        className="rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto outline-none"
        style={{ background: '#fff', border: '1px solid #d6e8dc' }}
        onClick={event => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id={titleId} className="text-base font-semibold text-[#0c1a12]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 min-w-10 min-h-10 inline-flex items-center justify-center rounded-md text-[#4e7460] hover:bg-[#eef4f0] transition-colors">
            <Icon.X />
          </button>
        </div>
        <div ref={bodyRef}>{children}</div>
      </div>
    </div>
  )
}
