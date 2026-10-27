import type { PendingObligations } from '@/features/members/api/membersApi'

export type PendingKindKey = 'monthlyPayments' | 'loans' | 'interests' | 'activitySales'

export const pendingKindLabels: Record<PendingKindKey, string> = {
  monthlyPayments: 'Cuotas',
  loans: 'Préstamos (capital)',
  interests: 'Intereses',
  activitySales: 'Ventas de actividades',
}

export interface PendingKind {
  key: PendingKindKey
  label: string
  count: number
  amount: number
}

// Fixed display order (MEM-10); kinds with no items are dropped. Amounts come from the backend.
export const pendingKinds = (obligations: PendingObligations): PendingKind[] => [
  { key: 'monthlyPayments' as const, label: pendingKindLabels.monthlyPayments, count: obligations.monthlyPayments.count, amount: obligations.monthlyPayments.amount },
  { key: 'loans' as const, label: pendingKindLabels.loans, count: obligations.loans.count, amount: obligations.loans.amount },
  { key: 'interests' as const, label: pendingKindLabels.interests, count: obligations.interests.count, amount: obligations.interests.amount },
  { key: 'activitySales' as const, label: pendingKindLabels.activitySales, count: obligations.activitySales.count, amount: obligations.activitySales.amount },
].filter(kind => kind.count > 0)

export const hasPendingObligations = (obligations: PendingObligations | null | undefined) =>
  !!obligations && pendingKinds(obligations).length > 0

// "Suma de N pagos pendientes": N is the sum of the group counts.
export const pendingSumLabel = (obligations: PendingObligations) => {
  const count = pendingKinds(obligations).reduce((sum, kind) => sum + kind.count, 0)
  return `Suma de ${count} ${count === 1 ? 'pago pendiente' : 'pagos pendientes'}`
}

export const maxVisibleItems = 3

// Admin fee link: the payments list pre-filtered by member, fee month and Pending status.
export const feePath = (memberId: string, year: number, month: number) =>
  `/payments?member=${memberId}&month=${year}-${String(month).padStart(2, '0')}&status=pending`
export const loanPath =(loanId: string) => `/loans/${loanId}`
export const interestPath = (loanId: string, interestId: string) => `/loans/${loanId}/interest-payments/${interestId}`
export const assignmentPath = (activityId: string, assignmentId: string) => `/activities/${activityId}/assignments/${assignmentId}`
