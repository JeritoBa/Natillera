import { describe, expect, it } from 'vitest'
import type { TransactionType } from '@/features/transactions/api/transactionsApi'
import { filterTransactions, transactionMonthKey, transactionMonthOptions } from '@/features/transactions/model/transactionFilters'

// Colombia is UTC-5 all year, so these instants do not depend on the machine time zone.
const tx = (type: TransactionType, occurredAt: string) => ({ type, occurredAt })

const transactions = [
  tx('MonthlyPayment', '2026-11-01T04:30:00Z'), // 23:30 on 31/10 in Colombia
  tx('Loan', '2026-10-05T17:00:00Z'),
  tx('MonthlyPayment', '2026-09-30T17:00:00Z'),
  tx('Activity', '2025-12-01T15:00:00Z'),
]

describe('transaction filters (UI-06)', () => {
  it('uses the Colombia date for the month key, whatever the browser time zone', () => {
    expect(transactionMonthKey('2026-11-01T04:30:00Z')).toBe('2026-10')
    expect(transactionMonthKey('2026-11-01T05:30:00Z')).toBe('2026-11')
    expect(transactionMonthKey('2026-01-01T04:59:00Z')).toBe('2025-12')
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
