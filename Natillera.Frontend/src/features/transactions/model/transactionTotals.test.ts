import { describe, expect, it } from 'vitest'
import { transactionTotals } from '@/features/transactions/model/transactionTotals'

describe('transaction totals (FIN-06, TX-01)', () => {
  it('sums income and expense', () => {
    expect(transactionTotals([
      { amount: 50000, direction: 'Income', isCancelled: false },
      { amount: 20000, direction: 'Income', isCancelled: false },
      { amount: 30000, direction: 'Expense', isCancelled: false },
    ])).toEqual({ income: 70000, expense: 30000 })
  })

  it('excludes cancelled transactions from both totals', () => {
    expect(transactionTotals([
      { amount: 50000, direction: 'Income', isCancelled: false },
      { amount: 90000, direction: 'Income', isCancelled: true },
      { amount: 30000, direction: 'Expense', isCancelled: true },
    ])).toEqual({ income: 50000, expense: 0 })
  })

  it('returns zero for an empty list', () => {
    expect(transactionTotals([])).toEqual({ income: 0, expense: 0 })
  })
})
