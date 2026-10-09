import type { InterestPaymentResponse, LoanDetail, LoanPaymentResponse } from '@/features/loans/api/loansApi'

export interface LoanSummaryView {
  isCancelled: boolean
  principalPaid: number
  outstandingPrincipal: number
  interestGenerated: number
  interestPaid: number
  outstandingInterest: number
  totalOutstanding: number
  totalPaid: number
  activePayments: LoanPaymentResponse[]
  pendingInterestCount: number
  paidInterestCount: number
  principalPaidPct: number
  interestPaidPct: number
}

const round = (value: number) => Math.round(value * 100) / 100
const pct = (part: number, whole: number) => whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)) : 0
const countByStatus = (items: InterestPaymentResponse[], status: InterestPaymentResponse['status']) => items.filter(item => item.status === status).length

export function getLoanSummary(loan: LoanDetail): LoanSummaryView {
  const { summary } = loan
  return {
    isCancelled: loan.status === 'Cancelled',
    principalPaid: summary.principalPaid,
    outstandingPrincipal: summary.outstandingPrincipal,
    interestGenerated: summary.interestGenerated,
    interestPaid: summary.interestPaid,
    outstandingInterest: summary.outstandingInterest,
    totalOutstanding: summary.totalOutstanding,
    totalPaid: round(summary.principalPaid + summary.interestPaid),
    activePayments: loan.payments.filter(payment => payment.status !== 'Cancelled'),
    pendingInterestCount: countByStatus(loan.interestPayments, 'Pending'),
    paidInterestCount: countByStatus(loan.interestPayments, 'Paid'),
    principalPaidPct: pct(summary.principalPaid, loan.initialAmount),
    interestPaidPct: pct(summary.interestPaid, summary.interestGenerated),
  }
}
