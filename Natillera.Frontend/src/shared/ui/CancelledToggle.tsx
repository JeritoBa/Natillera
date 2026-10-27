interface CancelledToggleProps {
  count: number
  shown: boolean
  onToggle: () => void
}

// UI-16: detail child tables hide cancelled rows behind this toggle (local state). Hidden when there is nothing to show.
export function CancelledToggle({ count, shown, onToggle }: CancelledToggleProps) {
  if (count === 0) return null
  return <div className="px-3 sm:px-5 py-2 border-t flex" style={{ borderColor: '#eef4f0' }}>
    <button type="button" onClick={onToggle} aria-expanded={shown} className="btn-ghost px-3 min-h-10 rounded-lg text-xs font-medium w-full sm:w-auto">{shown ? 'Ocultar anulados' : `Ver anulados (${count})`}</button>
  </div>
}
