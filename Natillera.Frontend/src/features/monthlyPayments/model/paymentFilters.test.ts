import { describe, expect, it } from 'vitest'
import { countPaymentsByStatus, feeMonthKey, filterPayments, parsePaymentMemberFilter, parsePaymentMonthFilter, parsePaymentStatusFilter, paymentMemberOptions, paymentMonthOptions, paymentStatusCounts, type FilterablePayment } from '@/features/monthlyPayments/model/paymentFilters'

const payment = (userId: string, member: string, year: number, monthNumber: number, status: FilterablePayment['status']): FilterablePayment =>
  ({ userId, member, year, monthNumber, status })

const payments = [
  payment('u1', 'Luis Gálvez', 2026, 10, 'pending'),
  payment('u2', 'Ana Gallego', 2026, 10, 'paid'),
  payment('u2', 'Ana Gallego', 2026, 9, 'paid'),
  payment('u1', 'Luis Gálvez', 2025, 12, 'cancelled'),
]

describe('payment filters (MP-09, UI-06)', () => {
  it('builds the month key from the fee year and month, zero padded', () => {
    expect(feeMonthKey(payments[0])).toBe('2026-10')
    expect(feeMonthKey(payment('u', 'x', 2026, 3, 'paid'))).toBe('2026-03')
  })

  it('filters by member, month and status, combined', () => {
    expect(filterPayments(payments, 'all', 'all', 'all')).toHaveLength(3) // UI-16: "all" hides the cancelled fee
    expect(filterPayments(payments, 'all', 'all', 'cancelled')).toEqual([payments[3]])
    expect(filterPayments(payments, 'u2', 'all')).toHaveLength(2)
    expect(filterPayments(payments, 'all', '2026-10')).toHaveLength(2)
    expect(filterPayments(payments, 'all', 'all', 'paid')).toHaveLength(2)
    expect(filterPayments(payments, 'u1', '2026-10', 'pending')).toEqual([payments[0]])
    expect(filterPayments(payments, 'u2', '2026-10', 'pending')).toEqual([])
  })

  it('counts by status', () => {
    expect(countPaymentsByStatus(payments)).toEqual({ all: 3, pending: 1, paid: 2, cancelled: 1 })
  })

  it('counts by status within the member and month filters', () => {
    expect(paymentStatusCounts(payments, 'u1', 'all')).toEqual({ all: 1, pending: 1, paid: 0, cancelled: 1 })
    expect(paymentStatusCounts(payments, 'all', '2026-10')).toEqual({ all: 2, pending: 1, paid: 1, cancelled: 0 })
  })

  it('lists members A-Z and months newest first, with counts', () => {
    expect(paymentMemberOptions(payments)).toEqual([{ id: 'u2', name: 'Ana Gallego', count: 2 }, { id: 'u1', name: 'Luis Gálvez', count: 2 }])
    expect(paymentMonthOptions(payments)).toEqual([{ key: '2026-10', count: 2 }, { key: '2026-09', count: 1 }, { key: '2025-12', count: 1 }])
  })
})

// UI-15
describe('payment filters from the URL', () => {
  it('parses the status', () => {
    expect(parsePaymentStatusFilter('pending')).toBe('pending')
    expect(parsePaymentStatusFilter('cancelled')).toBe('cancelled')
    expect(parsePaymentStatusFilter('xyz')).toBe('all')
    expect(parsePaymentStatusFilter('Pending')).toBe('all')
    expect(parsePaymentStatusFilter(null)).toBe('all')
  })

  it('parses the member and the month', () => {
    expect(parsePaymentMemberFilter('u-1')).toBe('u-1')
    expect(parsePaymentMemberFilter(null)).toBe('all')
    expect(parsePaymentMonthFilter('2026-03')).toBe('2026-03')
    expect(parsePaymentMonthFilter('2019-13')).toBe('all')
    expect(parsePaymentMonthFilter(null)).toBe('all')
  })
})
