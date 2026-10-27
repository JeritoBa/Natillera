import { describe, expect, it } from 'vitest'
import { canEditLoan, loanEditLocks } from './loanEdit'

describe('loan edit (LOAN-12)', () => {
  it('locks amount, borrower and start date when the loan has movements', () => {
    expect(loanEditLocks({ hasMovements: true })).toEqual({ borrower: true, amount: true, startDate: true })
  })

  it('locks nothing without movements or when creating', () => {
    expect(loanEditLocks({ hasMovements: false })).toEqual({ borrower: false, amount: false, startDate: false })
    expect(loanEditLocks(null)).toEqual({ borrower: false, amount: false, startDate: false })
  })

  it('offers editing for Active and Paid loans but not Cancelled ones', () => {
    expect(canEditLoan({ status: 'Active' })).toBe(true)
    expect(canEditLoan({ status: 'Paid' })).toBe(true)
    expect(canEditLoan({ status: 'Cancelled' })).toBe(false)
  })
})
