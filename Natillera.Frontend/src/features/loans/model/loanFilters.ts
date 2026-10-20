import type { LoanListItem } from '@/features/loans/api/loansApi'
import { normalizeSearch } from '@/shared/lib/search'

// UI-06: month filters use startDate.slice(0, 7).
export const loanStartMonth = (loan: Pick<LoanListItem, 'startDate'>) => loan.startDate.slice(0, 7)

export function filterLoans(loans: LoanListItem[], term: string, month: 'all' | string): LoanListItem[] {
  const query = normalizeSearch(term.trim())
  return loans.filter(loan => {
    if (month !== 'all' && loanStartMonth(loan) !== month) return false
    if (!query) return true
    return normalizeSearch(loan.borrowerName).includes(query)
  })
}
