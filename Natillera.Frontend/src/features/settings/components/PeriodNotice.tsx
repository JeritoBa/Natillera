import { Link } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'

// Amber notice for the "current year has no period" fallback, same palette as the dashboard notice.
interface PeriodNoticeProps {
  currentYear: number
  selectedYear: number
  onDismiss?: () => void
  showLink?: boolean
}

export function PeriodNotice({ currentYear, selectedYear, onDismiss, showLink = true }: PeriodNoticeProps) {
  return (
    <div role="status" className="flex items-start gap-3 border border-[#f3dc9a] bg-[#fef6dc] px-4 py-2.5 text-sm text-[#7a5b00]">
      <p className="min-w-0 flex-1">
        Aún no existe el periodo {currentYear}. Estás viendo el periodo {selectedYear}, el más reciente.
        {showLink && <>{' '}<Link to="/settings" className="font-medium underline">Cambiar periodo</Link></>}
      </p>
      {onDismiss && <button type="button" onClick={onDismiss} aria-label="Cerrar aviso" className="inline-flex min-h-10 min-w-10 -my-2 items-center justify-center"><Icon.X /></button>}
    </div>
  )
}
