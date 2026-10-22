import { Link } from 'react-router-dom'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { Icon } from '@/shared/ui/Icon'

// Shows the selected saving period and opens /settings. Hidden in demo mode (no period) and when there are no periods.
export function PeriodChip({ className = '' }: { className?: string }) {
  const { selected, status, periods } = useSavingPeriod()
  if (!selected && !(status === 'loading')) return null
  if (status === 'ready' && periods.length === 0) return null
  const label = selected ? `Periodo ${selected.year}` : 'Periodo …'
  return (
    <Link
      to="/settings"
      aria-label={selected ? `Periodo de ahorro ${selected.year}. Cambiar en Configuración` : 'Periodo de ahorro. Cambiar en Configuración'}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#d6e8dc] bg-[#eef4f0] px-3 text-xs text-[#0c5c38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c5c38] ${className}`}
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}
    >
      <Icon.Calendar />{label}
    </Link>
  )
}
