import type { MemberPendingObligations } from '@/features/dashboard/api/dashboardApi'
import { pendingKindLabels, type PendingKindKey } from '@/features/members/model/pendingObligations'
import { formatCurrency } from '@/shared/lib/formatters'

// DASH-14: pure logic behind the "Pendientes por cobrar" section of the Admin dashboard.
export type PendingFilter = 'all' | PendingKindKey

export const pendingKindOrder: PendingKindKey[] = ['monthlyPayments', 'loans', 'interests', 'activitySales']
export const pendingFilterOrder: PendingFilter[] = ['all', ...pendingKindOrder]
export const pendingFilterLabels: Record<PendingFilter, string> = { all: 'Todos', ...pendingKindLabels }

// Unknown or missing values mean "Todos".
export const parsePendingFilter = (value: string | null | undefined): PendingFilter =>
  pendingKindOrder.find(kind => kind === value) ?? 'all'

const byAmountThenName = (amount: (row: MemberPendingObligations) => number) =>
  (a: MemberPendingObligations, b: MemberPendingObligations) =>
    amount(b) - amount(a) || a.memberName.localeCompare(b.memberName, 'es')

export const pendingMainAmount = (row: MemberPendingObligations, filter: PendingFilter) =>
  filter === 'all' ? row.total : row[filter].amount

// "Todos": members with total > 0 by total desc; a kind: members with an amount > 0 in it, by that amount desc. Then name.
export const filterPendingByMember = (rows: MemberPendingObligations[], filter: PendingFilter) =>
  rows
    .filter(row => pendingMainAmount(row, filter) > 0)
    .sort(byAmountThenName(row => pendingMainAmount(row, filter)))

// Number of members each filter would show.
export const pendingFilterCounts = (rows: MemberPendingObligations[]): Record<PendingFilter, number> => ({
  all: rows.filter(row => row.total > 0).length,
  monthlyPayments: rows.filter(row => row.monthlyPayments.amount > 0).length,
  loans: rows.filter(row => row.loans.amount > 0).length,
  interests: rows.filter(row => row.interests.amount > 0).length,
  activitySales: rows.filter(row => row.activitySales.amount > 0).length,
})

// A filter with 0 members falls back to "Todos" (the URL is not rewritten).
export const resolvePendingFilter = (filter: PendingFilter, counts: Record<PendingFilter, number>): PendingFilter =>
  counts[filter] > 0 ? filter : 'all'

const round2 = (value: number) => Math.round(value * 100) / 100

export interface PendingColumnTotals extends Record<PendingKindKey, number> {
  total: number
}

export const pendingColumnTotals = (rows: MemberPendingObligations[]): PendingColumnTotals => ({
  monthlyPayments: round2(rows.reduce((sum, row) => sum + row.monthlyPayments.amount, 0)),
  loans: round2(rows.reduce((sum, row) => sum + row.loans.amount, 0)),
  interests: round2(rows.reduce((sum, row) => sum + row.interests.amount, 0)),
  activitySales: round2(rows.reduce((sum, row) => sum + row.activitySales.amount, 0)),
  total: round2(rows.reduce((sum, row) => sum + row.total, 0)),
})

const words: Record<PendingKindKey, [string, string]> = {
  monthlyPayments: ['cuota', 'cuotas'],
  loans: ['préstamo', 'préstamos'],
  interests: ['interés', 'intereses'],
  activitySales: ['venta', 'ventas'],
}

export const pendingCountWord = (kind: PendingKindKey, count: number) => `${count} ${words[kind][count === 1 ? 0 : 1]}`

// Secondary line of the two-column layout: counts per kind ("Todos") or "{count} · Total {total}" for a kind.
export const pendingCountLine = (row: MemberPendingObligations, filter: PendingFilter) =>
  filter === 'all'
    ? pendingKindOrder.filter(kind => row[kind].count > 0).map(kind => pendingCountWord(kind, row[kind].count)).join(' · ')
    : `${pendingCountWord(filter, row[filter].count)} · Total ${formatCurrency(row.total)}`

// Where an amount cell leads (spec 021 "Links").
export const pendingAmountPath = (kind: PendingKindKey | 'total', userId: string) => {
  if (kind === 'monthlyPayments') return `/payments?member=${userId}&status=pending`
  if (kind === 'loans') return `/loans?borrower=${userId}&status=Active`
  return `/members/${userId}#pendientes`
}

export const pendingShownLabel = (shown: number, total: number) => `Mostrando ${shown} de ${total} miembros con pendientes`
