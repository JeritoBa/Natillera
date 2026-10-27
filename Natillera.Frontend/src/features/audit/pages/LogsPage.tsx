import { Icon } from '@/shared/ui/Icon'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { getLogsPage, type LogPage } from '@/features/audit/api/logsApi'
import { actionBackground, actionColor, actionLabel, actions, entityBackground, entityColor, entityLabel, entityTypes } from '@/features/audit/model/labels'
import { parseLogActionFilter, parseLogDateFilter, parseLogEntityFilter } from '@/features/audit/model/logFilters'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { pageRange } from '@/shared/lib/pagination'
import { useClearUrlParams, useUrlPage, useUrlParam, useUrlTextParam } from '@/shared/lib/useUrlFilter'
import { formatCurrency } from '@/shared/lib/formatters'
import { Pager } from '@/shared/ui/Pager'
import { cell, cellActions, cellFirst, cellLast, cellMain, colDesktop, colTablet, eyeButton, headCell, subMobile, subTablet, tableCardStyle, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'

const filterKeys = ['q', 'entity', 'action', 'from', 'to', 'page'] as const
const money = (value: number | null) => value === null ? '—' : formatCurrency(value)

export function LogsPage() {
  const { session } = useAuth()
  const { selected } = useSavingPeriod()
  const navigate = useNavigate()
  const [data, setData] = useState<LogPage | null>(null)
  // UI-15 / UI-17: the filters and the page live in the URL (the search text is debounced); changing a filter returns to page 1 in the same update.
  const [search, setSearch, resetSearch] = useUrlTextParam('q', 300, true)
  const [entity, setEntity] = useUrlParam('entity', parseLogEntityFilter, 'all', true)
  const [action, setAction] = useUrlParam('action', parseLogActionFilter, 'all', true)
  const [from, setFrom] = useUrlParam('from', parseLogDateFilter, '', true)
  const [to, setTo] = useUrlParam('to', parseLogDateFilter, '', true)
  const [page, setPage] = useUrlPage()
  const [searchParams] = useSearchParams()
  const urlSearch = searchParams.get('q') ?? '' // the debounced text: the one the server is asked for
  const clearUrlFilters = useClearUrlParams(filterKeys)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const tableRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!session) return
    const id = ++requestId.current // a slower, older response must never overwrite a newer one
    setFetching(true)
    try {
      const result = await getLogsPage(session.accessToken, { page, q: urlSearch, entity, action, from, to })
      if (id !== requestId.current) return
      setData(result); setError(null)
    } catch (requestError) {
      if (id !== requestId.current) return
      setData(null); setError(getFriendlyApiError(requestError))
    } finally {
      if (id === requestId.current) { setLoading(false); setFetching(false) }
    }
  }, [session, page, urlSearch, entity, action, from, to])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const goToPage = (next: number) => {
    setPage(next)
    tableRef.current?.scrollIntoView?.({ block: 'start' })
  }

  const logs = data?.items ?? []
  const total = data?.total ?? 0
  const { from: rangeFrom, to: rangeTo, totalPages } = pageRange(page, data?.pageSize ?? 50, total)
  const hasFilters = entity !== 'all' || action !== 'all' || from !== '' || to !== '' || search !== '' || urlSearch !== ''
  const clearFilters = () => { resetSearch(); clearUrlFilters() }
  const label = 'block text-xs text-[#4e7460] mb-1'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Logs</h1><p className="text-[#4e7460] text-sm">Historial de auditoría de operaciones financieras{selected ? ` · Periodo ${selected.year}` : ''}</p></div>
      <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por usuario, entidad, acción, id o monto" className="w-full px-3 py-2.5 rounded-lg text-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={label}>Entidad</label><select value={entity} onChange={event => setEntity(parseLogEntityFilter(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="all">Todas</option>{entityTypes.map(value => <option key={value} value={value}>{entityLabel[value]}</option>)}</select></div>
          <div><label className={label}>Acción</label><select value={action} onChange={event => setAction(parseLogActionFilter(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="all">Todas</option>{actions.map(value => <option key={value} value={value}>{actionLabel[value]}</option>)}</select></div>
          <div><label className={label}>Desde</label><input type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
          <div><label className={label}>Hasta</label><input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap"><p className="text-xs text-[#4e7460]" aria-live="polite">{rangeFrom === 0 ? `Mostrando 0 de ${total} registros` : `Mostrando ${rangeFrom}–${rangeTo} de ${total} registros`}</p>{hasFilters && <button onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs font-medium">Limpiar filtros</button>}</div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      <div ref={tableRef} className={`${tableWrap} scroll-mt-4`} style={tableCardStyle} aria-busy={fetching}><div className={`${tableScroll} transition-opacity ${fetching && !loading ? 'opacity-60' : ''}`}><table className="w-full text-sm"><thead><tr style={tableHeadStyle}>{[['Fecha', `${cellFirst} ${colTablet} text-left`], ['Acción', `${cell} ${colDesktop} text-left`], ['Entidad', `${cell} text-left`], ['Usuario', `${cell} ${colDesktop} text-left`], ['Valor anterior → nuevo', `${cell} ${colTablet} text-right`], ['Acciones', `${cellLast} ${colTablet} text-right`]].map(([heading, cls]) => <th key={heading} className={`${headCell} ${cls}`}>{heading}</th>)}</tr></thead><tbody>
        {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">Cargando logs...</td></tr>}
        {!loading && !error && total === 0 && !hasFilters && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">No hay logs registrados</td></tr>}
        {!loading && !error && total === 0 && hasFilters && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]"><p>No hay resultados para los filtros aplicados</p><button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Limpiar filtros</button></td></tr>}
        {!loading && !error && total > 0 && logs.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]"><p>Esta página no tiene registros.</p><button type="button" onClick={() => goToPage(1)} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Ir a la primera página</button></td></tr>}
        {!loading && logs.map(log => <tr key={log.id} className="table-row">
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
      </tbody></table></div>
      <Pager page={page} totalPages={totalPages} onChange={goToPage} />
      </div>
    </div>
  )
}
