import { apiRequest } from '@/shared/api/apiClient'
import type { Member, MemberFormValues } from '@/features/members/model/memberTypes'
import type { TransactionDirection, TransactionType } from '@/features/transactions/api/transactionsApi'

export interface MemberDetailInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface MemberBalance {
  savings: number
  activityEarnings: number
  performanceEarnings: number
  total: number
}

export interface MemberPendingPayment {
  id: string
  year: number
  month: number
  amount: number
  status: string
  createdAt: string
  transactionId: string | null
}

export interface MemberTransaction {
  id: string
  amount: number
  direction: TransactionDirection
  type: TransactionType
  occurredAt: string
  description: string
}

export interface PendingObligationGroup<TItem> {
  count: number
  amount: number
  items: TItem[]
}

export interface PendingMonthlyPaymentItem { id: string; year: number; month: number; amount: number }
export interface PendingLoanItem { id: string; startDate: string; initialAmount: number; outstandingPrincipal: number }
export interface PendingInterestItem { id: string; loanId: string; createdAt: string; amount: number }
export interface PendingActivitySaleItem { id: string; activityId: string; activityName: string; quantity: number; salePrice: number; amount: number }

// MEM-10: everything a member still owes (derived by the backend).
export interface PendingObligations {
  total: number
  monthlyPayments: PendingObligationGroup<PendingMonthlyPaymentItem>
  loans: PendingObligationGroup<PendingLoanItem>
  interests: PendingObligationGroup<PendingInterestItem>
  activitySales: PendingObligationGroup<PendingActivitySaleItem>
}

export interface MemberDetail {
  member: MemberDetailInfo
  balance: MemberBalance
  pendingPayments: MemberPendingPayment[]
  transactions: MemberTransaction[]
  pendingObligations: PendingObligations
}

export const getMemberDetail = (token: string, id: string) =>
  apiRequest<MemberDetail>(`/api/members/${id}/details`, { token })

export const getMembers = (token: string) => apiRequest<Member[]>('/api/members', { token })

export const createMember = (token: string, values: MemberFormValues) =>
  apiRequest<Member>('/api/members', { method: 'POST', token, body: JSON.stringify(values) })

export const updateMember = (token: string, id: string, values: MemberFormValues) =>
  apiRequest<Member>(`/api/members/${id}`, { method: 'PUT', token, body: JSON.stringify(values) })

export const updateMemberStatus = (token: string, id: string, isActive: boolean) =>
  apiRequest<Member>(`/api/members/${id}/status`, { method: 'PATCH', token, body: JSON.stringify({ isActive }) })
