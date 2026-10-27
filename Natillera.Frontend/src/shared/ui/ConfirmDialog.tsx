import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { FormError } from '@/shared/ui/FormError'
import { Modal } from '@/shared/ui/Modal'

interface ConfirmDialogProps {
  title: string
  summary?: ReactNode
  consequences: string[]
  confirmLabel: string
  runningLabel?: string
  cancelLabel?: string
  /** If it throws, the friendly error is shown inside the dialog and the dialog stays open. */
  onConfirm: () => Promise<void>
  onClose: () => void
}

// UI-13: accessible confirmation for every cancellation. The initial focus lands on the first button ("Volver").
export function ConfirmDialog({ title, summary, consequences, confirmLabel, runningLabel = 'Anulando…', cancelLabel = 'Volver', onConfirm, onClose }: ConfirmDialogProps) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const consequencesId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  // After a failed attempt the disabled button loses the focus: bring it back to the retry button.
  useEffect(() => {
    if (running || !error) return
    if (!bodyRef.current?.contains(document.activeElement)) confirmRef.current?.focus()
  }, [running, error, attempt])

  const confirm = async () => {
    if (running) return
    setRunning(true)
    setError(null)
    setAttempt(count => count + 1)
    try { await onConfirm() }
    catch (requestError) { setError(getFriendlyApiError(requestError)); setRunning(false) }
  }

  return (
    <Modal title={title} role="alertdialog" describedBy={consequencesId} busy={running} onClose={() => { if (!running) onClose() }}>
      <div ref={bodyRef} className="space-y-4">
        {summary}
        <ul id={consequencesId} className="list-disc pl-5 space-y-1 text-sm text-[#0c1a12]">
          {consequences.map(text => <li key={text}>{text}</li>)}
        </ul>
        <FormError message={error} revision={attempt} />
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => { if (!running) onClose() }} disabled={running} className="btn-ghost flex-1 py-2.5 min-h-10 rounded-lg text-sm">{cancelLabel}</button>
          <button ref={confirmRef} type="button" onClick={() => void confirm()} disabled={running} className="btn-danger flex-1 py-2.5 min-h-10 rounded-lg text-sm">{running ? runningLabel : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}
