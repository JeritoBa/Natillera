import { describe, expect, it } from 'vitest'
import { buildTransactionQuery } from './transactionsApi'

// TX-03
describe('buildTransactionQuery', () => {
  it('omits default values', () => {
    expect(buildTransactionQuery({ page: 1, type: 'all', month: 'all' })).toBe('')
  })

  it('sends page, type and month when they are not the default', () => {
    expect(buildTransactionQuery({ page: 3, type: 'LoanPayment', month: '2026-03' })).toBe('?page=3&type=LoanPayment&month=2026-03')
    expect(buildTransactionQuery({ page: 1, type: 'Loan', month: 'all' })).toBe('?type=Loan')
  })
})
