import { apiRequest } from '@/shared/api/apiClient'

export type LogEntityType = 'MonthlyPayment' | 'Activity' | 'ActivitySale' | 'Loan' | 'LoanPayment' | 'Performance' | 'Transaction'
export type LogAction = 'Create' | 'Update' | 'Delete'

export interface LogListItem {
  id: string
  entityType: LogEntityType
  entityId: string
  action: LogAction
  occurredAt: string
  oldValue: number | null
  newValue: number | null
  userId: string
  userName: string
}

export interface LogEntitySummary {
  memberName: string | null
  year: number | null
  month: number | null
  status: string | null
  amount: number | null
  transactionId: string | null
}

export interface LogDetail extends LogListItem {
  userEmail: string
  entitySummary: LogEntitySummary
}

export const getLogs = (token: string) =>
  apiRequest<LogListItem[]>('/api/logs', { token })

export const getLogDetail = (token: string, id: string) =>
  apiRequest<LogDetail>(`/api/logs/${id}`, { token })
