import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  buildFeeLedger, feeLedgerEmptyText, feeLedgerLinkPath, feeLedgerSummary, feeMonthSrText, hasLiveFees, monthAbbreviations, yearMonthOf,
  type FeeLedgerAudience, type FeeLedgerMonth, type FeeMonthState, type LedgerFee,
} from '@/features/monthlyPayments/model/feeLedger'
import { formatCurrency } from '@/shared/lib/formatters'
import { Icon } from '@/shared/ui/Icon'

interface FeeLedgerProps {
  year: number
  /** null while the fees are loading or when the request failed. */
  fees: LedgerFee[] | null
  memberId: string
  audience: FeeLedgerAudience
  loading: boolean
  error: string | null
  onRetry: () => void
  titleId: string
}

// MEM-11: no red anywhere (a month without fee is not a debt) and the state never relies on color alone.
const stateStyle: Record<FeeMonthState, { className: string, color: string }> = {
  paid: { className: 'bg-[#dcf5e8] border border-solid border-[#b8e2c8]', color: '#0a6635' },
  pending: { className: 'bg-[#fef6dc] border border-solid border-[#f3dc9a]', color: '#9a6e00' },
  none: { className: 'bg-white border border-dashed border-[#c9d9cf]', color: '#4e7460' },
  upcoming: { className: 'bg-[#f8fbf8] border border-transparent', color: '#4e7460' },
}
const glyphClass = 'inline-flex items-center justify-center [&>svg]:size-4'
const chipBase = 'flex h-full w-full min-h-14 sm:min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-center'
const gridClass = 'grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-12 xl:gap-1.5'

function Glyph({ state }: { state: FeeMonthState }): ReactNode {
  if (state === 'paid') return <span aria-hidden="true" className={glyphClass}><Icon.Check /></span>
  if (state === 'pending') return <span aria-hidden="true" className={glyphClass}><Icon.Clock /></span>
  if (state === 'none') return <span aria-hidden="true" className={glyphClass}>—</span>
  return <span aria-hidden="true" className={glyphClass} />
}

function Chip({ month, year, path }: { month: FeeLedgerMonth, year: number, path: string | null }) {
  const style = stateStyle[month.state]
  const text = feeMonthSrText(month, year)
  const className = `${chipBase} ${style.className} ${month.isCurrent ? 'shadow-[inset_0_-2px_0_#0c5c38]' : ''} ${path ? 'hover:brightness-95 focus-visible:outline-2 focus-visible:outline-[#0c5c38]' : ''}`
  const content = <>
    <span aria-hidden="true" className="text-xs font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>{monthAbbreviations[month.month - 1]}</span>
    <Glyph state={month.state} />
    {month.amount !== null && <span aria-hidden="true" className="mono hidden max-w-full truncate text-[11px] sm:block">{formatCurrency(month.amount)}</span>}
    <span className="sr-only">{text}</span>
  </>
  return <li aria-current={month.isCurrent ? 'date' : undefined}>
    {path
      ? <Link to={path} title={text} className={className} style={{ color: style.color }}>{content}</Link>
      : <div className={className} style={{ color: style.color }}>{content}</div>}
  </li>
}

function LegendItem({ state, label }: { state: FeeMonthState, label: string }) {
  const style = stateStyle[state]
  return <li className="inline-flex items-center gap-1.5">
    <span aria-hidden="true" className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs [&>svg]:size-3 ${style.className}`} style={{ color: style.color }}>
      {state === 'paid' ? <Icon.Check /> : state === 'pending' ? <Icon.Clock /> : state === 'none' ? '—' : null}
    </span>
    {label}
  </li>
}

export function FeeLedger({ year, fees, memberId, audience, loading, error, onRetry, titleId }: FeeLedgerProps) {
  const today = yearMonthOf(new Date())
  const months = fees ? buildFeeLedger(fees, memberId, year, today) : null

  return <section aria-labelledby={titleId} aria-busy={loading} className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
    <h2 id={titleId} className="text-sm font-semibold text-[#0c1a12]">Cuotas de {year}</h2>
    {loading && <>
      <p role="status" className="sr-only">Cargando cuotas…</p>
      <div aria-hidden="true" className={`${gridClass} mt-3`}>
        {Array.from({ length: 12 }, (_, index) => <div key={index} className="min-h-14 rounded-lg bg-[#eef4f0] sm:min-h-[72px]" />)}
      </div>
    </>}
    {!loading && error && <div role="alert" className="mt-3 space-y-3 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">
      <p>{error}</p>
      <button type="button" onClick={onRetry} className="btn-ghost min-h-10 rounded-lg px-4 text-sm">Reintentar</button>
    </div>}
    {!loading && !error && months && <>
      <p className="mt-1 text-xs text-[#4e7460]">{feeLedgerSummary(months, year, today)}</p>
      <ol aria-label={`Cuotas de ${year} por mes`} className={`${gridClass} mt-3`}>
        {months.map(month => <Chip key={month.key} month={month} year={year} path={feeLedgerLinkPath(month, memberId, audience)} />)}
      </ol>
      {!hasLiveFees(months) && year <= today.year && <p className="mt-3 text-sm text-[#4e7460]">{feeLedgerEmptyText(audience, year)}</p>}
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#4e7460]">
        <LegendItem state="paid" label="Pagada" />
        <LegendItem state="pending" label="Pendiente" />
        <LegendItem state="none" label="Sin cuota" />
        <LegendItem state="upcoming" label="Por venir" />
      </ul>
    </>}
  </section>
}
