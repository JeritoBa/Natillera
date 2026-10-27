import { formatDateOnly } from '@/features/loans/model/labels'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'

// MEM-11: state of each of the 12 months of the selected saving period for one member.
export type FeeMonthState = 'paid' | 'pending' | 'none' | 'upcoming'
export type FeeLedgerAudience = 'admin' | 'member'

export interface LedgerFee {
  userId: string
  year: number
  month: number
  amount: number
  status: 'Pending' | 'Paid' | 'Cancelled'
  paidAt: string | null
}

export interface YearMonth { year: number, month: number }

export interface FeeLedgerMonth {
  month: number
  key: string
  state: FeeMonthState
  amount: number | null
  paidAt: string | null
  isCurrent: boolean
}

export const monthAbbreviations = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_IN_PERIOD = 12

export const yearMonthOf = (date: Date): YearMonth => ({ year: date.getFullYear(), month: date.getMonth() + 1 })

// Months of the period that have already started: all of a past period, none of a future one, up to today in the current one.
export function startedMonths(year: number, today: YearMonth): number {
  if (year < today.year) return MONTHS_IN_PERIOD
  if (year > today.year) return 0
  return today.month
}

export function buildFeeLedger(fees: LedgerFee[], memberId: string, year: number, today: YearMonth): FeeLedgerMonth[] {
  const started = startedMonths(year, today)
  return Array.from({ length: MONTHS_IN_PERIOD }, (_, index) => {
    const month = index + 1
    const live = fees.filter(fee => fee.userId === memberId && fee.year === year && fee.month === month && fee.status !== 'Cancelled')
    // At most one live fee exists per member and month (MP-04); if data ever has both, Paid wins.
    const fee = live.find(item => item.status === 'Paid') ?? live[0]
    const state: FeeMonthState = fee ? (fee.status === 'Paid' ? 'paid' : 'pending') : month <= started ? 'none' : 'upcoming'
    return {
      month, key: `${year}-${String(month).padStart(2, '0')}`, state,
      amount: fee?.amount ?? null, paidAt: fee?.status === 'Paid' ? fee.paidAt : null,
      isCurrent: year === today.year && month === today.month,
    }
  })
}

// Member dashboard: Paid fees come from the payments list (MP-09: a Member only receives Paid ones, of every member)
// and Pending fees from the pending obligations of the dashboard (DASH-11).
export function memberLedgerFees(paidList: LedgerFee[], pendingItems: { year: number, month: number, amount: number }[], memberId: string, year: number): LedgerFee[] {
  const paid = paidList.filter(fee => fee.userId === memberId && fee.year === year)
  const pending: LedgerFee[] = pendingItems
    .filter(item => item.year === year)
    .map(item => ({ userId: memberId, year: item.year, month: item.month, amount: item.amount, status: 'Pending', paidAt: null }))
  return [...paid, ...pending]
}

export const hasLiveFees = (months: FeeLedgerMonth[]) => months.some(month => month.state === 'paid' || month.state === 'pending')

export function feeLedgerSummary(months: FeeLedgerMonth[], year: number, today: YearMonth): string {
  if (year > today.year) return `El periodo ${year} aún no empieza`
  const paid = months.filter(month => month.state === 'paid').length
  const pending = months.filter(month => month.state === 'pending').length
  const none = months.filter(month => month.state === 'none').length
  const parts = [`${paid} de ${MONTHS_IN_PERIOD} meses pagados`]
  if (pending > 0) parts.push(`${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`)
  if (none > 0) parts.push(`${none} sin cuota`)
  return parts.join(' · ')
}

export const feeLedgerEmptyText = (audience: FeeLedgerAudience, year: number) =>
  audience === 'admin' ? `Aún no tiene cuotas registradas en ${year}.` : `Aún no tienes cuotas registradas en ${year}.`

// The Admin sees Paid and Pending fees in the list; a Member only sees Paid ones (MP-09), so Pending months are not links for them.
export function feeLedgerLinkPath(month: FeeLedgerMonth, memberId: string, audience: FeeLedgerAudience): string | null {
  const linkable = month.state === 'paid' || (audience === 'admin' && month.state === 'pending')
  return linkable ? `/payments?member=${encodeURIComponent(memberId)}&month=${month.key}` : null
}

export function feeMonthSrText(month: FeeLedgerMonth, year: number): string {
  const label = `${formatMonth(month.month)} ${year}`
  switch (month.state) {
    case 'paid': return `${label}: pagada, ${formatCurrency(month.amount ?? 0)}${month.paidAt ? `, el ${formatDateOnly(month.paidAt)}` : ''}`
    case 'pending': return `${label}: pendiente, ${formatCurrency(month.amount ?? 0)}`
    case 'none': return `${label}: sin cuota registrada`
    case 'upcoming': return `${label}: por venir`
  }
}
