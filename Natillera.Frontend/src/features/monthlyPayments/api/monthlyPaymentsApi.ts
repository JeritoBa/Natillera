import { apiRequest } from '@/shared/api/apiClient'

export type MonthlyPaymentStatus = 'Pending' | 'Paid' | 'Cancelled'

export interface CreateMonthlyPaymentRequest {
  userId: string
  year: number
  month: number
  amount: number
  status: 'Pending' | 'Paid'
}

export interface MonthlyPaymentResponse {
  id: string
  userId: string
  transactionId: string | null
  amount: number
  year: number
  month: number
  paidAt: string | null
  status: MonthlyPaymentStatus
  memberName: string
}

export const getMonthlyPayments = (token: string) =>
  apiRequest<MonthlyPaymentResponse[]>('/api/monthly-payments', { token })

export function createMonthlyPayment(token: string, request: CreateMonthlyPaymentRequest) {
  return apiRequest<MonthlyPaymentResponse>('/api/monthly-payments', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}

export function updateMonthlyPayment(token: string, id: string, request: CreateMonthlyPaymentRequest) {
  return apiRequest<MonthlyPaymentResponse>(`/api/monthly-payments/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  })
}

export const cancelMonthlyPayment = (token: string, id: string) =>
  apiRequest<void>(`/api/monthly-payments/${id}`, { method: 'DELETE', token })
