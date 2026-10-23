import { apiRequest } from '@/shared/api/apiClient'

export type LoanStatus = 'Active' | 'Paid' | 'Cancelled'
export type PaymentStatus = 'Pending' | 'Paid' | 'Cancelled'
export type PaymentMethod = 'Cash' | 'Transfer'

export interface LoanListItem {
  id: string
  borrowerId: string
  borrowerName: string
  initialAmount: number
  interestRate: number
  startDate: string
  status: LoanStatus
  outstandingPrincipal: number
  description?: string | null
}

export interface LoanRequest {
  borrowerId: string
  initialAmount: number
  interestRate: number
  startDate: string
  description?: string | null
}

export interface LoanPaymentResponse {
  id: string
  loanId: string
  transactionId: string
  amount: number
  paidAt: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
}

export interface InterestPaymentResponse {
  id: string
  loanId: string
  transactionId: string | null
  amount: number
  description: string
  status: PaymentStatus
  createdAt: string
  paidAt: string | null
}

export interface LoanSummary {
  principalPaid: number
  outstandingPrincipal: number
  interestGenerated: number
  interestPaid: number
  outstandingInterest: number
  totalOutstanding: number
}

export interface LoanDetail {
  id: string
  transactionId: string
  borrowerId: string
  borrowerName: string
  initialAmount: number
  interestRate: number
  startDate: string
  description?: string | null
  endDate: string | null
  status: LoanStatus
  createdAt: string
  updatedAt: string | null
  summary: LoanSummary
  payments: LoanPaymentResponse[]
  interestPayments: InterestPaymentResponse[]
}

export interface LoanPaymentRequest {
  amount: number
  paymentMethod: PaymentMethod
}

export interface InterestPaymentRequest {
  amount: number
  description: string
  status: 'Pending' | 'Paid'
}

const json = (method: string, token: string, body?: unknown) =>
  ({ method, token, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })

export const getLoans = (token: string) => apiRequest<LoanListItem[]>('/api/loans', { token })
export const getLoanDetail = (token: string, id: string) => apiRequest<LoanDetail>(`/api/loans/${id}`, { token })
export const createLoan = (token: string, request: LoanRequest) => apiRequest<LoanDetail>('/api/loans', json('POST', token, request))
export const updateLoan = (token: string, id: string, request: LoanRequest) => apiRequest<LoanDetail>(`/api/loans/${id}`, json('PUT', token, request))
export const cancelLoan = (token: string, id: string) => apiRequest<void>(`/api/loans/${id}`, json('DELETE', token))

export const getLoanPayment = (token: string, loanId: string, paymentId: string) =>
  apiRequest<LoanPaymentResponse>(`/api/loans/${loanId}/payments/${paymentId}`, { token })
export const createLoanPayment = (token: string, loanId: string, request: LoanPaymentRequest) =>
  apiRequest<LoanPaymentResponse>(`/api/loans/${loanId}/payments`, json('POST', token, request))
export const updateLoanPayment = (token: string, loanId: string, paymentId: string, request: LoanPaymentRequest) =>
  apiRequest<LoanPaymentResponse>(`/api/loans/${loanId}/payments/${paymentId}`, json('PUT', token, request))
export const cancelLoanPayment = (token: string, loanId: string, paymentId: string) =>
  apiRequest<void>(`/api/loans/${loanId}/payments/${paymentId}`, json('DELETE', token))

export const getInterestPayment = (token: string, loanId: string, interestId: string) =>
  apiRequest<InterestPaymentResponse>(`/api/loans/${loanId}/interest-payments/${interestId}`, { token })
export const createInterestPayment = (token: string, loanId: string, request: InterestPaymentRequest) =>
  apiRequest<InterestPaymentResponse>(`/api/loans/${loanId}/interest-payments`, json('POST', token, request))
export const updateInterestPayment = (token: string, loanId: string, interestId: string, request: InterestPaymentRequest) =>
  apiRequest<InterestPaymentResponse>(`/api/loans/${loanId}/interest-payments/${interestId}`, json('PUT', token, request))
export const cancelInterestPayment = (token: string, loanId: string, interestId: string) =>
  apiRequest<void>(`/api/loans/${loanId}/interest-payments/${interestId}`, json('DELETE', token))
