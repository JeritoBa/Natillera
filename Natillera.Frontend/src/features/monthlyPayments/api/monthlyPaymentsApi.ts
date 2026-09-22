import { apiRequest } from '@/shared/api/apiClient'

export interface CreateMonthlyPaymentRequest {
  userId: string
  year: number
  month: number
  amount: number
}

export interface MonthlyPaymentResponse {
  id: string
  userId: string
  transactionId: string
  amount: number
  year: number
  month: number
  paidAt: string
  status: string
  memberName: string
}

export const getPaidMonthlyPayments = (token: string) =>
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
