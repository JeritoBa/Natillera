import type { LoanListItem } from '@/features/loans/api/loansApi'

// LOAN-12: a loan with movements (non-cancelled payment or interest) keeps amount, borrower and start date locked.
export const LOAN_EDIT_LOCK_NOTE = 'Este préstamo ya tiene abonos o intereses: solo se pueden cambiar la tasa de interés y la descripción.'

export interface LoanEditLocks {
  borrower: boolean
  amount: boolean
  startDate: boolean
}

export const loanEditLocks = (loan: Pick<LoanListItem, 'hasMovements'> | null): LoanEditLocks => {
  const locked = loan?.hasMovements === true
  return { borrower: locked, amount: locked, startDate: locked }
}

// Editing is offered for every non-cancelled loan (Active or Paid).
export const canEditLoan = (loan: Pick<LoanListItem, 'status'>) => loan.status !== 'Cancelled'
