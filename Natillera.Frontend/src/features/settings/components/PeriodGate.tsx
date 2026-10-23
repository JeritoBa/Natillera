import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { getFriendlyApiError } from '@/shared/api/apiError'

// PER-04: no period-scoped page renders (or fetches) before the selected period, and so the X-Saving-Id header, exist.
// /settings always renders because it shows the loading, error and empty states itself.
export function PeriodGate({ children }: { children: ReactNode }) {
  const { selected, status, error, reload } = useSavingPeriod()
  const { pathname } = useLocation()
  const { isDemo } = useAuth()
  if (selected || isDemo || pathname === '/settings') return <>{children}</>
  if (status === 'loading') return <p role="status" className="p-8 text-sm text-[#4e7460]">Cargando periodo…</p>
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl">
      <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">
        {status === 'error' ? <>No se pudieron cargar los periodos. {getFriendlyApiError(error)}</> : 'Aún no hay periodos de ahorro configurados. Avísale al administrador de la natillera.'}
      </p>
      <button type="button" onClick={reload} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3">Reintentar</button>
    </div>
  )
}
