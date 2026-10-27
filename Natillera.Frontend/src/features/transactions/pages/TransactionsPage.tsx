import { Icon } from '@/shared/ui/Icon'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { Link, useNavigate } from 'react-router-dom'
import { getTransactionsPage, type TransactionPage, type TransactionType } from '@/features/transactions/api/transactionsApi'
import { parseTransactionMonthFilter, parseTransactionTypeFilter, transactionTypeOrder } from '@/features/transactions/model/transactionFilters'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { pageRange } from '@/shared/lib/pagination'
import { useClearUrlParams, useUrlPage, useUrlParam } from '@/shared/lib/useUrlFilter'
import { formatCurrency, formatMonth, formatShortCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Pager } from '@/shared/ui/Pager'
import { StatCard } from '@/shared/ui/StatCard'
import { cell, cellActions, cellAmount, cellFirst, cellLast, colDesktop, colTablet, eyeButton, headCell, subMobile, subTablet, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'

const typeLabel: Record<TransactionType, string> = {
  MonthlyPayment: 'Cuota mensual', Activity: 'Actividad', ActivitySale: 'Venta', Loan: 'Préstamo', LoanPayment: 'Pago préstamo', Performance: 'Rendimiento', ExtraCost: 'Costo extra',
}
const typeColor: Record<TransactionType, string> = {
  MonthlyPayment: '#0a6635', Activity: '#9a6e00', ActivitySale: '#0074b3', Loan: '#c0392b', LoanPayment: '#0a6635', Performance: '#0074b3', ExtraCost: '#9a6e00',
}
const typeBackground: Record<TransactionType, string> = {
  MonthlyPayment: '#dcf5e8', Activity: '#fef6dc', ActivitySale: '#ddf0ff', Loan: '#fde8e4', LoanPayment: '#dcf5e8', Performance: '#ddf0ff', ExtraCost: '#fef6dc',
}
const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
const filterKeys = ['type', 'month', 'page'] as const

export function TransactionsPage() {
  const { session } = useAuth()
  const { selected } = useSavingPeriod()
  const navigate = useNavigate()
  const [data, setData] = useState<TransactionPage | null>(null)
  // UI-15 / UI-17: the filters and the page live in the URL; changing a filter returns to page 1 in the same update.
  const [filter, setFilter] = useUrlParam('type', parseTransactionTypeFilter, 'all', true)
  const [month, setMonth] = useUrlParam('month', parseTransactionMonthFilter, 'all', true)
  const [page, setPage] = useUrlPage()
  const clearFilters = useClearUrlParams(filterKeys)
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
      const result = await getTransactionsPage(session.accessToken, { page, type: filter, month })
      if (id !== requestId.current) return
      setData(result); setError(null)
    } catch (requestError) {
      if (id !== requestId.current) return
      setData(null); setError(getFriendlyApiError(requestError))
    } finally {
      if (id === requestId.current) { setLoading(false); setFetching(false) }
    }
  }, [session, page, filter, month])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const goToPage = (next: number) => {
    setPage(next)
    tableRef.current?.scrollIntoView?.({ block: 'start' })
  }

  const transactions = data?.items ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 50
  // A valid month without movements is still selectable: it shows the empty list with "Limpiar filtros".
  const monthOptions = data ? (month !== 'all' && !data.months.some(option => option.month === month) ? [...data.months, { month, count: 0 }].sort((a, b) => b.month.localeCompare(a.month)) : data.months) : []
  const hasFilters = filter !== 'all' || month !== 'all'
  const { from, to, totalPages } = pageRange(page, pageSize, total)
  const monthText = (key: string) => `${formatMonth(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`
  const filterSuffix = hasFilters ? ' (filtro)' : ''
  const { income, expense } = data?.summary ?? { income: 0, expense: 0 }
  const periodIsEmpty = data !== null && data.months.length === 0 && !hasFilters

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Transacciones</h1><p className="text-[#4e7460] text-sm">Historial real de movimientos{selected ? ` · Periodo ${selected.year}` : ''}</p></div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <StatCard label={`Ingresos totales${filterSuffix}`} value={formatShortCurrency(income)} tone="positive" />
        <StatCard label={`Egresos totales${filterSuffix}`} value={formatShortCurrency(expense)} tone="negative" />
        <StatCard label={`Movimientos${filterSuffix}`} value={total} />
      </dl>
      {!loading && (monthOptions.length > 0 || hasFilters) && <div className="rounded-xl p-4 mb-4 space-y-3" style={cardStyle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="transaction-type-filter" className="block text-xs text-[#4e7460] mb-1">Tipo</label>
            <select id="transaction-type-filter" value={filter} onChange={event => setFilter(parseTransactionTypeFilter(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="all">Todos los tipos</option>
              {transactionTypeOrder.map(value => <option key={value} value={value}>{typeLabel[value]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="transaction-month-filter" className="block text-xs text-[#4e7460] mb-1">Mes</label>
            <select id="transaction-month-filter" value={month} onChange={event => setMonth(parseTransactionMonthFilter(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="all">Todos los meses</option>
              {monthOptions.map(option => <option key={option.month} value={option.month}>{`${monthText(option.month)} (${option.count})`}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#4e7460]" aria-live="polite">{from === 0 ? `Mostrando 0 de ${total} movimientos` : `Mostrando ${from}–${to} de ${total} movimientos`}</p>
          {hasFilters && <button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs">Limpiar filtros</button>}
        </div>
      </div>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      {error && !loading && <button onClick={() => { setLoading(true); void load() }} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-4">Reintentar</button>}
      <div ref={tableRef} className={`${tableWrap} scroll-mt-4`} style={cardStyle} aria-busy={fetching}><div className={`${tableScroll} transition-opacity ${fetching && !loading ? 'opacity-60' : ''}`}><table className="w-full text-sm"><thead><tr style={tableHeadStyle}>{[['Fecha', `${cellFirst} ${colTablet} text-left`], ['Descripción', `${cell} text-left`], ['Miembro', `${cell} ${colDesktop} text-left`], ['Tipo', `${cell} ${colTablet} text-left`], ['Valor', `${cell} text-right`], ['Acciones', `${cellLast} ${colTablet} text-right`]].map(([heading, cls]) => <th key={heading} className={`${headCell} ${cls}`}>{heading}</th>)}</tr></thead><tbody>
        {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]"><p role="status">Cargando transacciones...</p></td></tr>}
        {!loading && !error && periodIsEmpty && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">No hay transacciones registradas</td></tr>}
        {!loading && !error && total === 0 && hasFilters && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]"><p>No hay movimientos que coincidan con los filtros.</p><button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Limpiar filtros</button></td></tr>}
        {!loading && !error && total > 0 && transactions.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]"><p>Esta página no tiene movimientos.</p><button type="button" onClick={() => goToPage(1)} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Ir a la primera página</button></td></tr>}
        {!loading && transactions.map(transaction => {
          const date = new Date(transaction.occurredAt).toLocaleDateString('es-CO')
          const typeChip = <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: typeBackground[transaction.type], color: typeColor[transaction.type] }}>{typeLabel[transaction.type]}</span>
          return <tr key={transaction.id} className="table-row">
            <td className={`${cellFirst} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap ${colTablet}`}>{date}</td>
            <td className={`${cell} py-3.5 text-[#0c1a12] w-full sm:w-auto max-w-0 sm:max-w-none`}>
              <Link to={`/transactions/${transaction.id}`} title={transaction.description} className="block min-w-0 truncate sm:max-w-[150px] xl:max-w-[260px] sm:pointer-events-none focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">{transaction.description}</Link>
              <p className={subMobile}><span className="mono">{date}</span>{transaction.memberName && <span className="truncate min-w-0">· {transaction.memberName}</span>}{typeChip}{transaction.isCancelled && <Badge status="cancelled" />}</p>
              {transaction.memberName && <p className={subTablet}><span className="truncate">{transaction.memberName}</span></p>}
            </td>
            <td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460]`}>{transaction.memberName ?? '—'}</td>
            <td className={`${cell} ${colTablet} py-3.5`}><div className="flex flex-col items-start gap-1">{typeChip}{transaction.isCancelled && <Badge status="cancelled" />}</div></td>
            <td className={`${cell} py-3.5 ${cellAmount} font-semibold text-sm ${transaction.isCancelled ? 'text-[#4e7460] line-through' : transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.direction === 'Expense' ? '−' : '+'}{formatCurrency(transaction.amount)}</td>
            <td className={`${cellLast} py-3.5 ${cellActions} ${colTablet}`}><div className="flex justify-end gap-1"><button onClick={() => navigate(`/transactions/${transaction.id}`)} className={eyeButton} aria-label="Ver detalle"><Icon.Eye open /></button></div></td>
          </tr>
        })}
      </tbody></table></div>
      <Pager page={page} totalPages={totalPages} onChange={goToPage} />
      </div>
    </div>
  )
}
