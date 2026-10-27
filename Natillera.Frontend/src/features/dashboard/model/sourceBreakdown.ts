import type { DashboardSummary } from '@/features/dashboard/api/dashboardApi'
import { formatCurrency } from '@/shared/lib/formatters'

// DASH-13: the three registered sources of the natillera's money, in display order.
export interface SourceRow {
  key: 'fees' | 'activities' | 'interest'
  label: string
  detail: string
  amount: number
  color: string
  /** Short word used in the accessible label of the proportion bar. */
  shortLabel: string
}

export const sourceRows = (summary: Pick<DashboardSummary, 'paidMonthlyPayments' | 'activityEarnings' | 'sharedInterestPool' | 'loanInterestEarned' | 'paidExtraCosts'>): SourceRow[] => {
  const extraCosts = summary.paidExtraCosts ?? 0
  return [
    { key: 'fees', label: 'Cuotas pagadas', detail: 'Aportes de los miembros', amount: summary.paidMonthlyPayments ?? 0, color: '#0c5c38', shortLabel: 'cuotas' },
    { key: 'activities', label: 'Ganancias de actividades', detail: 'Margen de las ventas pagadas', amount: summary.activityEarnings ?? 0, color: '#3f9b6b', shortLabel: 'actividades' },
    {
      key: 'interest', label: 'Rendimientos de préstamos',
      detail: extraCosts > 0
        ? `Intereses pagados ${formatCurrency(summary.loanInterestEarned ?? 0)} − costos extra ${formatCurrency(extraCosts)}`
        : 'Intereses pagados',
      amount: summary.sharedInterestPool ?? 0, color: '#9a6e00', shortLabel: 'rendimientos',
    },
  ]
}

export interface ProportionSegment {
  row: SourceRow
  percent: number
}

// Only rows with a positive value get a segment. Percent = Math.round per segment (the sum may be 99 or 101).
export const proportionSegments = (rows: SourceRow[]): ProportionSegment[] => {
  const positive = rows.filter(row => row.amount > 0)
  const sum = positive.reduce((total, row) => total + row.amount, 0)
  return sum > 0 ? positive.map(row => ({ row, percent: Math.round((row.amount / sum) * 100) })) : []
}

export const proportionLabel = (segments: ProportionSegment[]) =>
  `Proporción: ${segments.map(segment => `${segment.row.shortLabel} ${segment.percent}%`).join(', ')}`
