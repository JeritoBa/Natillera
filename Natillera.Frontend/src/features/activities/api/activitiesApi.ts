import { apiRequest } from '@/shared/api/apiClient'

export type ActivityStatus = 'Pending' | 'Finished' | 'Cancelled'
export type AssignmentStatus = 'Pending' | 'Paid' | 'Cancelled'
export type ExtraCostStatus = 'Pending' | 'Paid' | 'Cancelled'

export interface ActivityListItem {
  id: string
  name: string
  description: string
  quantity: number
  unitCost: number
  unitSalePrice: number
  totalCost: number
  assignedQuantity: number
  availableQuantity: number
  startDate: string
  status: ActivityStatus
}

export interface ActivityAssignmentResponse {
  id: string
  activityId: string
  userId: string
  memberName: string
  quantityAssigned: number
  saleAmount: number
  status: AssignmentStatus
  assignedAt: string
  paidAt: string | null
  transactionId: string | null
}

export interface ExtraCost {
  id: string
  activityId: string
  description: string
  amount: number
  status: ExtraCostStatus
  createdAt: string
  paidAt: string | null
  transactionId: string | null
}

export interface ActivityDetail extends ActivityListItem {
  transactionId: string
  createdAt: string
  assignments: ActivityAssignmentResponse[]
  extraCosts: ExtraCost[]
}

export interface ActivityRequest {
  name: string
  description: string
  quantity: number
  unitCost: number
  unitSalePrice: number
  startDate: string
}

export interface ActivityAssignmentRequest {
  userId: string
  quantityAssigned: number
}

export interface ActivityAssignmentUpdateRequest {
  quantityAssigned: number
  status: 'Pending' | 'Paid'
}

export interface ExtraCostRequest {
  description: string
  amount: number
  status: 'Pending' | 'Paid'
}

const json = (method: string, token: string, body?: unknown) =>
  ({ method, token, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })

export const getActivities = (token: string) => apiRequest<ActivityListItem[]>('/api/activities', { token })
export const getActivityDetail = (token: string, id: string) => apiRequest<ActivityDetail>(`/api/activities/${id}`, { token })
export const createActivity = (token: string, request: ActivityRequest) => apiRequest<ActivityDetail>('/api/activities', json('POST', token, request))
export const updateActivity = (token: string, id: string, request: ActivityRequest) => apiRequest<ActivityDetail>(`/api/activities/${id}`, json('PUT', token, request))
export const cancelActivity = (token: string, id: string) => apiRequest<void>(`/api/activities/${id}`, json('DELETE', token))

export const getActivityAssignment = (token: string, activityId: string, assignmentId: string) =>
  apiRequest<ActivityAssignmentResponse>(`/api/activities/${activityId}/assignments/${assignmentId}`, { token })
export const createActivityAssignment = (token: string, activityId: string, request: ActivityAssignmentRequest) =>
  apiRequest<ActivityAssignmentResponse>(`/api/activities/${activityId}/assignments`, json('POST', token, request))
export const updateActivityAssignment = (token: string, activityId: string, assignmentId: string, request: ActivityAssignmentUpdateRequest) =>
  apiRequest<ActivityAssignmentResponse>(`/api/activities/${activityId}/assignments/${assignmentId}`, json('PUT', token, request))
export const cancelActivityAssignment = (token: string, activityId: string, assignmentId: string) =>
  apiRequest<void>(`/api/activities/${activityId}/assignments/${assignmentId}`, json('DELETE', token))

export const createExtraCost = (token: string, activityId: string, request: ExtraCostRequest) =>
  apiRequest<ExtraCost>(`/api/activities/${activityId}/extra-costs`, json('POST', token, request))
export const updateExtraCost = (token: string, activityId: string, extraCostId: string, request: ExtraCostRequest) =>
  apiRequest<ExtraCost>(`/api/activities/${activityId}/extra-costs/${extraCostId}`, json('PUT', token, request))
export const cancelExtraCost = (token: string, activityId: string, extraCostId: string) =>
  apiRequest<void>(`/api/activities/${activityId}/extra-costs/${extraCostId}`, json('DELETE', token))
