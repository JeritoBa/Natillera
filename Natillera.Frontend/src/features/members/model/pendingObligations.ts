import type { PendingObligations } from '@/features/members/api/membersApi'

export interface PendingKind {
  key: 'monthlyPayments' | 'loans' | 'interests' | 'activitySales'
  label: string
  count: number
  amount: number
}

// Fixed display order (MEM-10); kinds with no items are dropped. Amounts come from the backend.
export const pendingKinds = (obligations: PendingObligations): PendingKind[] => [
  { key: 'monthlyPayments' as const, label: 'Cuotas', count: obligations.monthlyPayments.count, amount: obligations.monthlyPayments.amount },
  { key: 'loans' as const, label: 'Préstamos (capital)', count: obligations.loans.count, amount: obligations.loans.amount },
  { key: 'interests' as const, label: 'Intereses', count: obligations.interests.count, amount: obligations.interests.amount },
  { key: 'activitySales' as const, label: 'Ventas de actividades', count: obligations.activitySales.count, amount: obligations.activitySales.amount },
].filter(kind => kind.count > 0)

export const hasPendingObligations = (obligations: PendingObligations | null | undefined) =>
  !!obligations && pendingKinds(obligations).length > 0

export const loanPath = (loanId: string) => `/loans/${loanId}`
export const interestPath = (loanId: string, interestId: string) => `/loans/${loanId}/interest-payments/${interestId}`
export const assignmentPath = (activityId: string, assignmentId: string) => `/activities/${activityId}/assignments/${assignmentId}`
