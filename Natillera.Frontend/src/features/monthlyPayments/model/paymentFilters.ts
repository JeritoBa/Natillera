import { parseIdParam, parseMonthKey, parseOneOf } from '@/shared/lib/urlFilterParams'

export type PaymentStatus = 'pending' | 'paid' | 'cancelled'
export type PaymentStatusFilter = 'all' | PaymentStatus

export interface FilterablePayment {
  userId: string
  member: string
  year: number
  monthNumber: number
  status: PaymentStatus
}

// UI-06: the month filter uses the fee's own year and month (YYYY-MM), not the paid date.
export const feeMonthKey = (payment: Pick<FilterablePayment, 'year' | 'monthNumber'>) =>
  `${payment.year}-${String(payment.monthNumber).padStart(2, '0')}`

export function filterPayments<T extends FilterablePayment>(payments: T[], memberId: 'all' | string, month: 'all' | string, status: PaymentStatusFilter = 'all'): T[] {
  return payments.filter(payment =>
    (memberId === 'all' || payment.userId === memberId)
    && (month === 'all' || feeMonthKey(payment) === month)
    && (status === 'all' || payment.status === status))
}

export function countPaymentsByStatus(payments: FilterablePayment[]): Record<PaymentStatusFilter, number> {
  const counts: Record<PaymentStatusFilter, number> = { all: payments.length, pending: 0, paid: 0, cancelled: 0 }
  for (const payment of payments) counts[payment.status] += 1
  return counts
}

// Members found in the payments (inactive ones included), A-Z, with their number of fees.
export function paymentMemberOptions(payments: FilterablePayment[]): { id: string, name: string, count: number }[] {
  const byId = new Map<string, { id: string, name: string, count: number }>()
  for (const payment of payments) {
    const option = byId.get(payment.userId) ?? { id: payment.userId, name: payment.member, count: 0 }
    option.count += 1
    byId.set(payment.userId, option)
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// Months found in the payments, newest first, with their number of fees.
export function paymentMonthOptions(payments: FilterablePayment[]): { key: string, count: number }[] {
  const counts = new Map<string, number>()
  for (const payment of payments) counts.set(feeMonthKey(payment), (counts.get(feeMonthKey(payment)) ?? 0) + 1)
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.key.localeCompare(a.key))
}

// UI-15: filters come from the URL; unknown values mean "Todos". Whether a member/month exists in the data is decided by the page.
export const parsePaymentStatusFilter = parseOneOf<PaymentStatus>(['pending', 'paid', 'cancelled'])
export const parsePaymentMemberFilter = parseIdParam
export const parsePaymentMonthFilter = parseMonthKey
