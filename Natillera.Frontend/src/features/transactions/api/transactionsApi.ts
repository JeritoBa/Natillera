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
