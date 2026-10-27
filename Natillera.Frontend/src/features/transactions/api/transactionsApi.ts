import { apiRequest } from '@/shared/api/apiClient'

export type TransactionDirection = 'Income' | 'Expense'
export type TransactionType = 'MonthlyPayment' | 'Activity' | 'ActivitySale' | 'Loan' | 'LoanPayment' | 'Performance' | 'ExtraCost'

export interface RealTransaction {
  id: string
  amount: number
  direction: TransactionDirection
  type: TransactionType
  occurredAt: string
  description: string
  memberName: string | null
  isCancelled: boolean
}

// TX-03: one server-side page of the period transactions, with the totals of the whole filtered set.
export interface TransactionPage {
  items: RealTransaction[]
  total: number
  page: number
  pageSize: number
  summary: { income: number, expense: number }
  months: { month: string, count: number }[]
}

export interface TransactionPageQuery {
  page: number
  type: 'all' | TransactionType
  month: 'all' | string
}

// Default values are omitted (the server defaults: page 1, no type, no month, page size 50).
export function buildTransactionQuery({ page, type, month }: TransactionPageQuery): string {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (type !== 'all') params.set('type', type)
  if (month !== 'all') params.set('month', month)
  const text = params.toString()
  return text ? `?${text}` : ''
}

export const getTransactionsPage = (token: string, query: TransactionPageQuery) =>
  apiRequest<TransactionPage>(`/api/transactions${buildTransactionQuery(query)}`, { token })

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
  activityId: string | null
}

export interface TransactionDetail extends RealTransaction {
  source: TransactionSourceDetail
}

export const getTransactionDetail = (token: string, id: string) =>
  apiRequest<TransactionDetail>(`/api/transactions/${id}`, { token })
