import type { LoanListItem, LoanStatus } from '@/features/loans/api/loansApi'
import { normalizeSearch } from '@/shared/lib/search'
import { parseIdParam, parseMonthKey } from '@/shared/lib/urlFilterParams'

// UI-06: month filters use startDate.slice(0, 7).
export const loanStartMonth = (loan: Pick<LoanListItem, 'startDate'>) => loan.startDate.slice(0, 7)

export type LoanStatusFilter = 'all' | LoanStatus

// UI-16: "all" means every status except Cancelled; cancelled loans only appear with the "Cancelled" status.
export const matchesLoanStatus = (loan: Pick<LoanListItem, 'status'>, status: LoanStatusFilter) =>
  status === 'all' ? loan.status !== 'Cancelled' : loan.status === status

// Everything but the status: search, month and borrower.
function filterLoansExceptStatus(loans: LoanListItem[], term: string, month: 'all' | string, borrowerId: 'all' | string): LoanListItem[] {
  const query = normalizeSearch(term.trim())
  return loans.filter(loan => {
    if (borrowerId !== 'all' && loan.borrowerId !== borrowerId) return false
    if (month !== 'all' && loanStartMonth(loan) !== month) return false
    if (!query) return true
    return normalizeSearch(loan.borrowerName).includes(query)
  })
}

export const filterLoans = (loans: LoanListItem[], term: string, month: 'all' | string, status: LoanStatusFilter = 'all', borrowerId: 'all' | string = 'all'): LoanListItem[] =>
  filterLoansExceptStatus(loans, term, month, borrowerId).filter(loan => matchesLoanStatus(loan, status))

export function countLoansByStatus(loans: LoanListItem[]): Record<LoanStatusFilter, number> {
  const counts: Record<LoanStatusFilter, number> = { all: 0, Active: 0, Paid: 0, Cancelled: 0 }
  for (const loan of loans) {
    counts[loan.status] += 1
    if (loan.status !== 'Cancelled') counts.all += 1
  }
  return counts
}

export interface LoanBorrowerOption {
  id: string
  name: string
  count: number
}

// Unique borrowers of the period, A-Z, with their number of loans.
export function loanBorrowerOptions(loans: LoanListItem[]): LoanBorrowerOption[] {
  const byId = new Map<string, LoanBorrowerOption>()
  for (const loan of loans) {
    const option = byId.get(loan.borrowerId)
    if (option) option.count += 1
    else byId.set(loan.borrowerId, { id: loan.borrowerId, name: loan.borrowerName, count: 1 })
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// UI-15: filters come from the URL; unknown values mean "Todos" (the page checks the borrower and the month against the data).
export const parseLoanStatusFilter = (value: string | null | undefined): LoanStatusFilter =>
  value === 'Active' || value === 'Paid' || value === 'Cancelled' ? value : 'all'

// UI-14: the status buttons count the loans left by the other filters (search, month, borrower), not the status itself.
export const loanStatusCounts = (loans: LoanListItem[], term: string, month: 'all' | string, borrowerId: 'all' | string): Record<LoanStatusFilter, number> =>
  countLoansByStatus(filterLoansExceptStatus(loans, term, month, borrowerId))

export const parseLoanBorrowerFilter = parseIdParam
export const parseLoanMonthFilter = parseMonthKey
