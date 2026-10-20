import { describe, expect, it } from 'vitest'
import type { LoanListItem } from '@/features/loans/api/loansApi'
import { filterLoans, loanStartMonth } from '@/features/loans/model/loanFilters'

const loan = (id: string, borrowerName: string, startDate: string): LoanListItem => ({
  id, borrowerId: `u-${id}`, borrowerName, initialAmount: 1000, interestRate: 2, startDate, status: 'Active', outstandingPrincipal: 1000,
})

const loans = [
  loan('1', 'Ana Gallego', '2026-10-03T00:00:00'),
  loan('2', 'Luis Gálvez', '2026-10-20T00:00:00'),
  loan('3', 'Ana Peña', '2026-09-01T00:00:00'),
]

const ids = (list: LoanListItem[]) => list.map(x => x.id)

describe('filterLoans', () => {
  it('searches the borrower accent- and case-insensitively', () => {
    expect(ids(filterLoans(loans, 'GALVEZ', 'all'))).toEqual(['2'])
    expect(ids(filterLoans(loans, 'pena', 'all'))).toEqual(['3'])
  })

  it('returns everything for "all" and an empty term', () => {
    expect(filterLoans(loans, '', 'all')).toHaveLength(3)
  })

  it('filters by month only', () => {
    expect(ids(filterLoans(loans, '', '2026-10'))).toEqual(['1', '2'])
  })

  it('combines month and search with AND', () => {
    expect(ids(filterLoans(loans, 'ana', '2026-10'))).toEqual(['1'])
  })

  it('returns an empty list without matches', () => {
    expect(filterLoans(loans, 'zzz', 'all')).toEqual([])
  })

  it('trims the term', () => {
    expect(ids(filterLoans(loans, '  gallego ', 'all'))).toEqual(['1'])
  })
})

describe('loanStartMonth', () => {
  it('UI-06 returns yyyy-mm', () => {
    expect(loanStartMonth({ startDate: '2026-10-03T00:00:00' })).toBe('2026-10')
  })
})
