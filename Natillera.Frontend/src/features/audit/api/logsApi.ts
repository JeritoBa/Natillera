import { apiRequest } from '@/shared/api/apiClient'

export type LogEntityType = 'MonthlyPayment' | 'Activity' | 'ActivityAssignment' | 'Loan' | 'LoanPayment' | 'Performance' | 'Transaction' | 'ExtraCost'
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
  activityId: string | null
  activityName: string | null
}

export interface LogDetail extends LogListItem {
  userEmail: string
  entitySummary: LogEntitySummary
}

// AUD-04: one server-side page of the period logs.
export interface LogPage {
  items: LogListItem[]
  total: number
  page: number
  pageSize: number
}

export interface LogPageQuery {
  page: number
  q: string
  entity: 'all' | LogEntityType
  action: 'all' | LogAction
  from: string
  to: string
}

// Default values are omitted (the server defaults: page 1, no filters, page size 50).
export function buildLogQuery({ page, q, entity, action, from, to }: LogPageQuery): string {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (q.trim() !== '') params.set('q', q.trim())
  if (entity !== 'all') params.set('entity', entity)
  if (action !== 'all') params.set('action', action)
  if (from !== '') params.set('from', from)
  if (to !== '') params.set('to', to)
  const text = params.toString()
  return text ? `?${text}` : ''
}

export const getLogsPage = (token: string, query: LogPageQuery) =>
  apiRequest<LogPage>(`/api/logs${buildLogQuery(query)}`, { token })

export const getLogDetail = (token: string, id: string) =>
  apiRequest<LogDetail>(`/api/logs/${id}`, { token })
