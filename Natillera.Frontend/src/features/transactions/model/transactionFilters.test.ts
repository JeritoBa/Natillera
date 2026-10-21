import { describe, expect, it } from 'vitest'
import type { TransactionType } from '@/features/transactions/api/transactionsApi'
import { filterTransactions, transactionMonthKey, transactionMonthOptions } from '@/features/transactions/model/transactionFilters'

// Built from local date parts so the tests do not depend on the machine time zone.
const at = (year: number, month: number, day: number, hour = 12) => new Date(year, month - 1, day, hour).toISOString()
const tx = (type: TransactionType, occurredAt: string) => ({ type, occurredAt })

const transactions = [
  tx('MonthlyPayment', at(2026, 10, 31, 23)),
  tx('Loan', at(2026, 10, 5)),
  tx('MonthlyPayment', at(2026, 9, 30)),
  tx('Activity', at(2025, 12, 1, 0)),
]

describe('transaction filters (UI-06)', () => {
  it('uses the local date for the month key (23:00 on the 31st stays in its month)', () => {
    expect(transactionMonthKey(at(2026, 10, 31, 23))).toBe('2026-10')
    expect(transactionMonthKey(at(2026, 1, 1, 0))).toBe('2026-01')
  })

  it('filters by type and month, combined', () => {
    expect(filterTransactions(transactions, 'all', 'all')).toHaveLength(4)
    expect(filterTransactions(transactions, 'MonthlyPayment', 'all')).toHaveLength(2)
    expect(filterTransactions(transactions, 'all', '2026-10')).toHaveLength(2)
    expect(filterTransactions(transactions, 'MonthlyPayment', '2026-10')).toEqual([transactions[0]])
    expect(filterTransactions(transactions, 'Loan', '2026-09')).toEqual([])
  })

  it('lists months newest first with counts', () => {
    expect(transactionMonthOptions(transactions)).toEqual([{ key: '2026-10', count: 2 }, { key: '2026-09', count: 1 }, { key: '2025-12', count: 1 }])
  })
})
