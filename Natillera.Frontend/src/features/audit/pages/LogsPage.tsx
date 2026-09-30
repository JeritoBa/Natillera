import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getLogs, type LogAction, type LogEntityType, type LogListItem } from '@/features/audit/api/logsApi'
import { actionBackground, actionColor, actionLabel, actions, entityLabel, entityTypes } from '@/features/audit/model/labels'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'

const money = (value: number | null) => value === null ? '—' : formatCurrency(value)
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

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
    const term = normalize(search.trim())
    return logs.filter(log => {
      if (entity !== 'all' && log.entityType !== entity) return false
      if (action !== 'all' && log.action !== action) return false
      const occurred = new Date(log.occurredAt)
      if (fromDate && occurred < fromDate) return false
      if (toDate && occurred > toDate) return false
      if (!term) return true
      const haystack = normalize([
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
    <div className="p-6 lg:p-8 max-w-5xl">
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
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{['Fecha', 'Acción', 'Entidad', 'Usuario', 'Valor anterior → nuevo'].map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${index === 4 ? 'text-right' : 'text-left'} ${index === 3 ? 'hidden md:table-cell' : ''}`}>{heading}</th>)}</tr></thead><tbody>
        {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-[#4e7460]">Cargando logs...</td></tr>}
        {!loading && !error && logs.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[#4e7460]">No hay logs registrados</td></tr>}
        {!loading && logs.length > 0 && filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[#4e7460]">No hay resultados para los filtros aplicados</td></tr>}
        {!loading && filtered.map(log => <tr key={log.id} onClick={() => navigate(`/logs/${log.id}`)} className="table-row cursor-pointer"><td className="px-5 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(log.occurredAt).toLocaleString('es-CO')}</td><td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: actionBackground[log.action], color: actionColor[log.action] }}>{actionLabel[log.action]}</span></td><td className="px-4 py-3.5 text-[#0c1a12]">{entityLabel[log.entityType]}</td><td className="px-4 py-3.5 text-[#4e7460] hidden md:table-cell">{log.userName}</td><td className="px-5 py-3.5 text-right mono text-sm text-[#0c1a12] whitespace-nowrap">{money(log.oldValue)} → {money(log.newValue)}</td></tr>)}
      </tbody></table></div></div>
    </div>
  )
}
