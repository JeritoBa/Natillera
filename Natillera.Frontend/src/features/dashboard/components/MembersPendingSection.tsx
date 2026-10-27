import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { MemberPendingObligations } from '@/features/dashboard/api/dashboardApi'
import {
  filterPendingByMember, parsePendingFilter, pendingAmountPath, pendingColumnTotals, pendingCountLine, pendingFilterCounts,
  pendingFilterLabels, pendingFilterOrder, pendingKindOrder, pendingMainAmount, pendingShownLabel, resolvePendingFilter,
  type PendingFilter,
} from '@/features/dashboard/model/pendingByMember'
import { pendingKindLabels, type PendingKindKey } from '@/features/members/model/pendingObligations'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { cellAmount, colDesktop, headCell, tableHeadStyle, tableScroll } from '@/shared/ui/tableStyles'

const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
// Spec 021: names wrap (never truncate) and the link keeps a 40 px touch target. Local on purpose: tableStyles.mainLink truncates.
const memberLink = 'inline-flex items-center min-h-10 font-medium text-[#0c1a12] hover:underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded [overflow-wrap:anywhere]'
const amountLink = 'inline-flex items-center justify-end min-h-10 px-1 whitespace-nowrap text-[#0c1a12] hover:underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded'

interface Props {
  rows: MemberPendingObligations[]
  loading: boolean
}

export function MembersPendingSection({ rows, loading }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const counts = pendingFilterCounts(rows)
  // The URL keeps the requested filter; a filter with 0 members is shown as "Todos" without rewriting it.
  const filter = resolvePendingFilter(parsePendingFilter(searchParams.get('pending')), counts)
  const visible = filterPendingByMember(rows, filter)
  const totals = pendingColumnTotals(visible)
  const allMembers = counts.all
  const mainHeading = filter === 'all' ? 'Total' : pendingFilterLabels[filter]
  const nobodyOwes = !loading && allMembers === 0

  const selectFilter = (next: PendingFilter) => setSearchParams(current => {
    const params = new URLSearchParams(current)
    if (next === 'all') params.delete('pending')
    else params.set('pending', next)
    return params
  }, { replace: true })

  const amountCell = (amount: number, kind: PendingKindKey | 'total', row: MemberPendingObligations): ReactNode => {
    if (amount <= 0) return <><span aria-hidden="true" className="text-[#4e7460]">—</span><span className="sr-only">Sin pendientes</span></>
    const label = kind === 'total'
      ? `Ver todos los pendientes de ${row.memberName}`
      : `Ver ${pendingKindLabels[kind].toLowerCase()} pendientes de ${row.memberName}`
    return <Link to={pendingAmountPath(kind, row.userId)} aria-label={label} className={amountLink}>{formatCurrency(amount)}</Link>
  }

  const desktopColumn = (kind: PendingKindKey | 'total') => {
    const sorting = filter === 'all' ? kind === 'total' : kind === filter
    return { sorting, highlight: sorting && filter !== 'all' ? 'font-semibold bg-[#f8fbf8]' : '' }
  }
  const desktopColumns: { kind: PendingKindKey | 'total', heading: string }[] = [
    ...pendingKindOrder.map(kind => ({ kind, heading: pendingKindLabels[kind] })),
    { kind: 'total', heading: 'Total' },
  ]
  const amountOf = (row: MemberPendingObligations, kind: PendingKindKey | 'total') => kind === 'total' ? row.total : row[kind].amount

  return <section aria-labelledby="pending-title" aria-busy={loading} className="rounded-xl overflow-hidden" style={cardStyle}>
    <div className="px-5 py-3.5 border-b" style={{ borderColor: '#eef4f0' }}>
      <h2 id="pending-title" className="font-semibold text-[#0c1a12] text-sm">Pendientes por cobrar</h2>
      <p className="text-xs text-[#4e7460]">Lo que cada miembro le debe a la natillera en este periodo</p>
    </div>
    {loading ? <p role="status" className="px-5 py-10 text-center text-sm text-[#4e7460]">Cargando pendientes...</p>
      : nobodyOwes ? <div className="px-5 py-10 text-center">
        <span aria-hidden="true" className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-[#0a6635]" style={{ background: '#dcf5e8' }}><Icon.Check /></span>
        <p className="text-sm font-semibold text-[#0c1a12]">Todos están al día</p>
        <p className="text-sm text-[#4e7460]">Nadie tiene pagos pendientes en este periodo.</p>
      </div>
      : <>
        <div className="px-5 py-3 space-y-2 border-b" style={{ borderColor: '#eef4f0' }}>
          <div role="group" aria-label="Filtrar por tipo de pendiente" className="flex gap-1.5 flex-wrap">
            {pendingFilterOrder.map(value => <button key={value} type="button" aria-pressed={filter === value} disabled={counts[value] === 0}
              onClick={() => selectFilter(value)}
              className={`px-3 min-h-10 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#0c5c38] ${filter === value ? 'bg-[#0c5c38] text-white' : 'btn-ghost'}`}>
              {pendingFilterLabels[value]} ({counts[value]})
            </button>)}
          </div>
          <p className="text-xs text-[#4e7460]" aria-live="polite">{pendingShownLabel(visible.length, allMembers)}</p>
        </div>
        <div className={tableScroll}>
          <table className="w-full text-sm">
            <caption className="sr-only">Pendientes por cobrar por miembro, ordenados de mayor a menor</caption>
            <thead><tr style={tableHeadStyle}>
              <th scope="col" className={`pl-3 pr-3 sm:pl-5 sm:pr-4 ${headCell} text-left`}>Miembro</th>
              <th scope="col" aria-sort="descending" className={`pl-3 pr-3 sm:pl-4 sm:pr-5 ${headCell} text-right xl:hidden`}>{mainHeading}</th>
              {desktopColumns.map(column => {
                const { sorting, highlight } = desktopColumn(column.kind)
                return <th key={column.kind} scope="col" aria-sort={sorting ? 'descending' : undefined}
                  className={`px-4 ${headCell} text-right ${colDesktop} ${highlight} ${column.kind === 'total' ? 'sm:pr-5' : ''}`}>{column.heading}</th>
              })}
            </tr></thead>
            <tbody>
              {visible.map(row => <tr key={row.userId} className="table-row">
                <th scope="row" className="pl-3 pr-3 sm:pl-5 sm:pr-4 py-2 text-left align-top font-normal">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Link to={`/members/${row.userId}`} aria-label={`Ver detalle de ${row.memberName}, debe ${formatCurrency(pendingMainAmount(row, filter))}`} className={memberLink}>{row.memberName}</Link>
                    {!row.isActive && <Badge status="inactive" />}
                  </div>
                  <p className="xl:hidden -mt-1 pb-1 text-xs text-[#4e7460]">{pendingCountLine(row, filter)}</p>
                </th>
                <td className={`pl-3 pr-3 sm:pl-4 sm:pr-5 py-2 align-top ${cellAmount} font-semibold xl:hidden`}>{amountCell(pendingMainAmount(row, filter), filter === 'all' ? 'total' : filter, row)}</td>
                {desktopColumns.map(column => {
                  const { highlight } = desktopColumn(column.kind)
                  return <td key={column.kind} className={`px-4 py-2 ${cellAmount} ${colDesktop} ${highlight} ${column.kind === 'total' ? 'sm:pr-5 font-semibold' : ''}`}>{amountCell(amountOf(row, column.kind), column.kind, row)}</td>
                })}
              </tr>)}
            </tbody>
            <tfoot><tr style={{ borderTop: '1px solid #d6e8dc', background: '#f8fbf8' }}>
              <th scope="row" className="pl-3 pr-3 sm:pl-5 sm:pr-4 py-3 text-left text-xs font-semibold text-[#0c1a12]">Total por cobrar</th>
              <td className={`pl-3 pr-3 sm:pl-4 sm:pr-5 py-3 ${cellAmount} font-semibold text-[#0c1a12] xl:hidden`}>{formatCurrency(filter === 'all' ? totals.total : totals[filter])}</td>
              {desktopColumns.map(column => <td key={column.kind} className={`px-4 py-3 ${cellAmount} font-semibold text-[#0c1a12] ${colDesktop} ${column.kind === 'total' ? 'sm:pr-5' : ''}`}>{formatCurrency(totals[column.kind])}</td>)}
            </tr></tfoot>
          </table>
        </div>
      </>}
  </section>
}
