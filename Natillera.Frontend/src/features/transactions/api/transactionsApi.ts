import { apiRequest } from '@/shared/api/apiClient'

export type TransactionDirection = 'Income' | 'Expense'
export type TransactionType = 'MonthlyPayment' | 'Activity' | 'ActivitySale' | 'Loan' | 'LoanPayment' | 'Performance'

export interface RealTransaction {
  id: string
  amount: number
  direction: TransactionDirection
  type: TransactionType
  occurredAt: string
  description: string
  memberName: string | null
}

export const getTransactions = (token: string) =>
  apiRequest<RealTransaction[]>('/api/transactions', { token })

export interface TransactionSourceDetail {
  entity: string
  entityId: string
  memberName: string | null
  year: number | null
  month: number | null
  status: string | null
  paidAt: string | null
  activityName: string | null
  activityDescription: string | null
  activityQuantity: number | null
  quantityAssigned: number | null
  unitCost: number | null
  unitSalePrice: number | null
  startDate: string | null
  assignedAt: string | null
  initialAmount: number | null
  interestRate: number | null
  loanStartDate: string | null
  loanEndDate: string | null
  paymentMethod: string | null
}

export interface TransactionDetail extends RealTransaction {
  source: TransactionSourceDetail
}

export const getTransactionDetail = (token: string, id: string) =>
  apiRequest<TransactionDetail>(`/api/transactions/${id}`, { token })
