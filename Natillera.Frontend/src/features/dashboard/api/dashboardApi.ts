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
  paidMonthlyPayments: number | null
  membersPendingObligations: MemberPendingObligations[] | null
}

export interface PendingKindTotal {
  count: number
  amount: number
}

// DASH-14: one row per member with total pending > 0 in the period (Admin only).
export interface MemberPendingObligations {
  userId: string
  memberName: string
  isActive: boolean
  total: number
  monthlyPayments: PendingKindTotal
  loans: PendingKindTotal
  interests: PendingKindTotal
  activitySales: PendingKindTotal
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
