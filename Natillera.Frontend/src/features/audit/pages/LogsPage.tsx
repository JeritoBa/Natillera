import { Icon } from '@/shared/ui/Icon'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getLogs, type LogAction, type LogEntityType, type LogListItem } from '@/features/audit/api/logsApi'
import { actionBackground, actionColor, actionLabel, actions, entityBackground, entityColor, entityLabel, entityTypes } from '@/features/audit/model/labels'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { normalizeSearch } from '@/shared/lib/search'
import { cell, cellActions, cellFirst, cellLast, cellMain, colDesktop, colTablet, eyeButton, headCell, subMobile, subTablet, tableCardStyle, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'

const money = (value: number | null) => value === null ? '—' : formatCurrency(value)

export function LogsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<LogListItem[]>([])
  const [entity, setEntity] = useState<LogEntityType | 'all'>('all')
  const [action, setAction] = useState<LogAction | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    const load = async () => {
      try { setLogs(await getLogs(session.accessToken)) }
      catch (requestError) { setError(getFriendlyApiError(requestError)) }
      finally { setLoading(false) }
    }
    void load()
  }, [session])

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(`${from}T00:00:00`) : null
    const toDate = to ? new Date(`${to}T23:59:59.999`) : null
    const term = normalizeSearch(search.trim())
    return logs.filter(log => {
      if (entity !== 'all' && log.entityType !== entity) return false
      if (action !== 'all' && log.action !== action) return false
      const occurred = new Date(log.occurredAt)
      if (fromDate && occurred < fromDate) return false
      if (toDate && occurred > toDate) return false
      if (!term) return true
      const haystack = normalizeSearch([
        log.userName, entityLabel[log.entityType], log.entityType, actionLabel[log.action], log.action, log.entityId,
        log.oldValue ?? '', log.newValue ?? '', log.oldValue !== null ? money(log.oldValue) : '', log.newValue !== null ? money(log.newValue) : '',
      ].join(' '))
      return haystack.includes(term)
    })
  }, [logs, entity, action, from, to, search])

  const hasFilters = entity !== 'all' || action !== 'all' || from !== '' || to !== '' || search !== ''
  const clearFilters = () => { setEntity('all'); setAction('all'); setFrom(''); setTo(''); setSearch('') }
  const label = 'block text-xs text-[#4e7460] mb-1'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Logs</h1><p className="text-[#4e7460] text-sm">Historial de auditoría de operaciones financieras</p></div>
      <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por usuario, entidad, acción, id o monto" className="w-full px-3 py-2.5 rounded-lg text-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={label}>Entidad</label><select value={entity} onChange={event => setEntity(event.target.value as LogEntityType | 'all')} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="all">Todas</option>{entityTypes.map(value => <option key={value} value={value}>{entityLabel[value]}</option>)}</select></div>
          <div><label className={label}>Acción</label><select value={action} onChange={event => setAction(event.target.value as LogAction | 'all')} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="all">Todas</option>{actions.map(value => <option key={value} value={value}>{actionLabel[value]}</option>)}</select></div>
          <div><label className={label}>Desde</label><input type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
          <div><label className={label}>Hasta</label><input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        </div>
        <div className="flex items-center justify-between"><p className="text-xs text-[#4e7460]">{filtered.length} de {logs.length} registros</p>{hasFilters && <button onClick={clearFilters} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-medium">Limpiar filtros</button>}</div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      <div className={tableWrap} style={tableCardStyle}><div className={tableScroll}><table className="w-full text-sm"><thead><tr style={tableHeadStyle}>{[['Fecha', `${cellFirst} ${colTablet} text-left`], ['Acción', `${cell} ${colDesktop} text-left`], ['Entidad', `${cell} text-left`], ['Usuario', `${cell} ${colDesktop} text-left`], ['Valor anterior → nuevo', `${cell} ${colTablet} text-right`], ['Acciones', `${cellLast} ${colTablet} text-right`]].map(([heading, cls]) => <th key={heading} className={`${headCell} ${cls}`}>{heading}</th>)}</tr></thead><tbody>
        {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">Cargando logs...</td></tr>}
        {!loading && !error && logs.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">No hay logs registrados</td></tr>}
        {!loading && logs.length > 0 && filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">No hay resultados para los filtros aplicados</td></tr>}
        {!loading && filtered.map(log => <tr key={log.id} className="table-row">
          <td className={`${cellFirst} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap ${colTablet}`}>{new Date(log.occurredAt).toLocaleDateString('es-CO')}</td>
          <td className={`${cell} py-3.5 ${colDesktop}`}><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: actionBackground[log.action], color: actionColor[log.action] }}>{actionLabel[log.action]}</span></td>
          <td className={`${cell} py-3.5 ${cellMain} sm:pl-4`}>
            <Link to={`/logs/${log.id}`} className="sm:hidden block truncate font-medium text-[#0c1a12] hover:underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">{entityLabel[log.entityType]} · {actionLabel[log.action]}</Link>
            <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: entityBackground[log.entityType], color: entityColor[log.entityType] }}>{entityLabel[log.entityType]}</span>
            <p className={subMobile}><span className="mono">{new Date(log.occurredAt).toLocaleDateString('es-CO')}</span><span>· {log.userName}</span></p>
            <p className={subTablet}><span className="mono whitespace-nowrap">{new Date(log.occurredAt).toLocaleTimeString('es-CO')}</span><span className="whitespace-nowrap">· {actionLabel[log.action]}</span><span className="whitespace-nowrap">· {log.userName}</span></p>
          </td>
          <td className={`${cell} py-3.5 text-[#4e7460] ${colDesktop}`}>{log.userName}</td>
          <td className={`${cell} py-3.5 text-right mono text-sm text-[#0c1a12] whitespace-nowrap ${colTablet}`}>{money(log.oldValue)} → {money(log.newValue)}</td>
          <td className={`${cellLast} py-3.5 ${cellActions} ${colTablet}`}><div className="flex justify-end gap-1"><button onClick={() => navigate(`/logs/${log.id}`)} className={eyeButton} aria-label="Ver detalle"><Icon.Eye open /></button></div></td>
        </tr>)}
      </tbody></table></div></div>
    </div>
  )
}
