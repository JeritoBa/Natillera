import type { LoanListItem, LoanStatus } from '@/features/loans/api/loansApi'
import { normalizeSearch } from '@/shared/lib/search'

// UI-06: month filters use startDate.slice(0, 7).
export const loanStartMonth = (loan: Pick<LoanListItem, 'startDate'>) => loan.startDate.slice(0, 7)

export type LoanStatusFilter = 'all' | LoanStatus

export function filterLoans(loans: LoanListItem[], term: string, month: 'all' | string, status: LoanStatusFilter = 'all'): LoanListItem[] {
  const query = normalizeSearch(term.trim())
  return loans.filter(loan => {
    if (status !== 'all' && loan.status !== status) return false
    if (month !== 'all' && loanStartMonth(loan) !== month) return false
    if (!query) return true
    return normalizeSearch(loan.borrowerName).includes(query)
  })
}

export function countLoansByStatus(loans: LoanListItem[]): Record<LoanStatusFilter, number> {
  const counts: Record<LoanStatusFilter, number> = { all: loans.length, Active: 0, Paid: 0, Cancelled: 0 }
  for (const loan of loans) counts[loan.status] += 1
  return counts
}
