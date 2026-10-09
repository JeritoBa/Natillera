import { describe, expect, it } from 'vitest'
import type { InterestPaymentResponse, LoanDetail, LoanPaymentResponse, LoanSummary, PaymentStatus } from '@/features/loans/api/loansApi'
import { getLoanSummary } from '@/features/loans/model/loanSummary'

const payment = (id: string, status: PaymentStatus): LoanPaymentResponse => ({
  id, loanId: 'l1', transactionId: `t-${id}`, amount: 100, paidAt: '2026-02-01', paymentMethod: 'Cash', status,
})
const interest = (id: string, status: PaymentStatus): InterestPaymentResponse => ({
  id, loanId: 'l1', transactionId: null, amount: 10, description: '', status, createdAt: '2026-02-01', paidAt: null,
})

const loan = (overrides: Partial<LoanDetail> = {}, summary: Partial<LoanSummary> = {}): LoanDetail => ({
  id: 'l1', transactionId: 't1', borrowerId: 'u1', borrowerName: 'Ana', initialAmount: 1000, interestRate: 2,
  startDate: '2026-01-01', endDate: null, status: 'Active', createdAt: '2026-01-01', updatedAt: null,
  summary: {
    principalPaid: 250, outstandingPrincipal: 750, interestGenerated: 100, interestPaid: 40, outstandingInterest: 60, totalOutstanding: 810,
    ...summary,
  },
  payments: [], interestPayments: [], ...overrides,
})

describe('getLoanSummary', () => {
  it('passes through the backend summary values', () => {
    expect(getLoanSummary(loan())).toMatchObject({
      principalPaid: 250, outstandingPrincipal: 750, interestGenerated: 100, interestPaid: 40, outstandingInterest: 60, totalOutstanding: 810,
    })
  })

  it('totalPaid = principalPaid + interestPaid, rounded to 2 decimals', () => {
    expect(getLoanSummary(loan()).totalPaid).toBe(290)
    expect(getLoanSummary(loan({}, { principalPaid: 0.1, interestPaid: 0.2 })).totalPaid).toBe(0.3)
  })

  it('activePayments excludes cancelled payments', () => {
    const s = getLoanSummary(loan({ payments: [payment('a', 'Paid'), payment('b', 'Cancelled'), payment('c', 'Pending')] }))
    expect(s.activePayments.map(p => p.id)).toEqual(['a', 'c'])
  })

  it('counts pending and paid interest, ignoring cancelled', () => {
    const s = getLoanSummary(loan({
      interestPayments: [interest('1', 'Pending'), interest('2', 'Pending'), interest('3', 'Paid'), interest('4', 'Cancelled')],
    }))
    expect(s.pendingInterestCount).toBe(2)
    expect(s.paidInterestCount).toBe(1)
  })

  it('computes percentages', () => {
    const s = getLoanSummary(loan())
    expect(s.principalPaidPct).toBe(25)
    expect(s.interestPaidPct).toBe(40)
  })

  it('returns 0% when the denominator is zero (no division by zero)', () => {
    const s = getLoanSummary(loan({ initialAmount: 0 }, { interestGenerated: 0, interestPaid: 0 }))
    expect(s.principalPaidPct).toBe(0)
    expect(s.interestPaidPct).toBe(0)
  })

  it('clamps percentages to the 0-100 range', () => {
    const over = getLoanSummary(loan({ initialAmount: 100 }, { principalPaid: 500, interestGenerated: 10, interestPaid: 50 }))
    expect(over.principalPaidPct).toBe(100)
    expect(over.interestPaidPct).toBe(100)
    const under = getLoanSummary(loan({}, { principalPaid: -10, interestPaid: -5 }))
    expect(under.principalPaidPct).toBe(0)
    expect(under.interestPaidPct).toBe(0)
  })

  it('flags only cancelled loans', () => {
    expect(getLoanSummary(loan({ status: 'Cancelled' })).isCancelled).toBe(true)
    expect(getLoanSummary(loan({ status: 'Active' })).isCancelled).toBe(false)
    expect(getLoanSummary(loan({ status: 'Paid' })).isCancelled).toBe(false)
  })
})
