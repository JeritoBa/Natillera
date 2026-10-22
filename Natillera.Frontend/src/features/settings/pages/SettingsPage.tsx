import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PeriodNotice } from '@/features/settings/components/PeriodNotice'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { getFriendlyApiError } from '@/shared/api/apiError'

const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }

export function SettingsPage() {
  const { isDemo } = useAuth()
  const { periods, selected, status, error, notice, select, reload } = useSavingPeriod()
  const [draftId, setDraftId] = useState<string | null>(null)
  const [savedYear, setSavedYear] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()
  const value = draftId ?? selected?.id ?? ''
  const unchanged = value === (selected?.id ?? '')
  const onlyOne = periods.length === 1
  const canSave = status === 'ready' && !unchanged && !!value

  const save = () => {
    if (!canSave) return
    const period = periods.find(item => item.id === value)
    if (!period) return
    select(period.id)
    setDraftId(null)
    setSavedYear(period.year)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Configuración</h1><p className="text-[#4e7460] text-sm">Ajustes de la aplicación en este dispositivo</p></div>
      <div className="rounded-xl p-5 max-w-xl" style={cardStyle}>
        {isDemo ? <p className="text-sm text-[#4e7460]">La configuración no está disponible en la demo.</p> : (
          <section aria-labelledby="settings-period-title">
            <h2 id="settings-period-title" className="text-base font-semibold text-[#0c1a12] mb-3">Periodo de ahorro</h2>
            {notice === 'currentYearMissing' && selected && <div className="mb-4"><PeriodNotice currentYear={currentYear} selectedYear={selected.year} showLink={false} /></div>}
            {status === 'error' && <>
              <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">No se pudieron cargar los periodos. {getFriendlyApiError(error)}</p>
              <button type="button" onClick={reload} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3">Reintentar</button>
            </>}
            {status === 'ready' && periods.length === 0 && <>
              <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">Aún no hay periodos de ahorro configurados. Avísale al administrador de la natillera.</p>
              <button type="button" onClick={reload} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3">Reintentar</button>
            </>}
            {(status === 'loading' || (status === 'ready' && periods.length > 0)) && (
              <form noValidate onSubmit={event => { event.preventDefault(); save() }} className="space-y-4">
                <div>
                  <label htmlFor="settings-period" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Año</label>
                  <select id="settings-period" aria-describedby="settings-period-help" value={value} disabled={status === 'loading' || onlyOne} onChange={event => { setDraftId(event.target.value); setSavedYear(null) }} className="w-full px-3 py-2.5 rounded-lg text-sm">
                    {status === 'loading' ? <option value="">Cargando periodos…</option> : periods.map(period => <option key={period.id} value={period.id}>{period.year === currentYear ? `${period.year} (año actual)` : period.year}</option>)}
                  </select>
                  {status === 'loading' && <p role="status" className="text-xs text-[#4e7460] mt-1.5">Cargando periodos…</p>}
                </div>
                <p id="settings-period-help" className="text-xs text-[#4e7460]">
                  El año decide qué datos ves en toda la aplicación y en qué periodo se guardan los registros nuevos. Puedes seguir consultando y editando registros de cualquier año. Este ajuste se guarda solo en este dispositivo.
                  {onlyOne && <> Por ahora solo existe el periodo {periods[0].year}.</>}
                </p>
                <div aria-live="polite">
                  {savedYear !== null && <p role="status" className="rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">Listo. Ahora estás viendo el periodo {savedYear}. <Link to="/dashboard" className="font-medium underline">Ir al resumen</Link></p>}
                </div>
                <div className="flex sm:justify-end">
                  <button type="submit" disabled={!canSave} aria-disabled={!canSave} className="btn-primary w-full sm:w-auto sm:px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">Guardar</button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
