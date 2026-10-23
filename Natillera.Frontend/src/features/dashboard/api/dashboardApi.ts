import type { PendingObligations } from '@/features/members/api/membersApi'
import { apiRequest } from '@/shared/api/apiClient'

export type DashboardDirection = 'Income' | 'Expense'
export type DashboardTransactionType = 'MonthlyPayment' | 'Activity' | 'ActivitySale' | 'Loan' | 'LoanPayment' | 'Performance' | 'ExtraCost'

export interface DashboardTransaction {
  id: string
  amount: number
  direction: DashboardDirection
  type: DashboardTransactionType
  occurredAt: string
  description: string
  memberName: string | null
}

export interface DashboardSummary {
  role: 'Admin' | 'Member'
  availableMoney: number
  totalNatilleraBalance: number | null
  lentMoney: number | null
  pendingActivitiesInvestment: number | null
  mySavings: number | null
  myEarnings: number | null
  pendingPayments: number | null
  recentTransactions: DashboardTransaction[]
  topSellers: TopSeller[]
  myPaidMonthlyPayments: number | null
  loanInterestEarned: number | null
  activityEarnings: number | null
  myActivityEarnings: number | null
  myPerformanceShare: number | null
  pendingObligations: PendingObligations | null
  sharedInterestPool: number | null
  paidExtraCosts: number | null
}

export interface TopSeller {
  userId: string
  memberName: string
  unitsSold: number
  collectedAmount: number
  earnings: number
}

export const getDashboardSummary = (token: string) =>
  apiRequest<DashboardSummary>('/api/dashboard/summary', { token })
