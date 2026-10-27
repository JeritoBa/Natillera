import { describe, expect, it } from 'vitest'
import type { LoanListItem } from '@/features/loans/api/loansApi'
import { countLoansByStatus, filterLoans, loanBorrowerOptions, loanStartMonth, loanStatusCounts, parseLoanBorrowerFilter, parseLoanMonthFilter, parseLoanStatusFilter } from '@/features/loans/model/loanFilters'

const loan = (id: string, borrowerName: string, startDate: string, status: LoanListItem['status'] = 'Active'): LoanListItem => ({
  id, borrowerId: `u-${id}`, borrowerName, initialAmount: 1000, interestRate: 2, startDate, status, outstandingPrincipal: 1000, hasMovements: false,
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

describe('filterLoans by status', () => {
  const mixed = [
    loan('1', 'Ana Gallego', '2026-10-03T00:00:00', 'Active'),
    loan('2', 'Luis Gálvez', '2026-10-20T00:00:00', 'Paid'),
    loan('3', 'Ana Peña', '2026-09-01T00:00:00', 'Cancelled'),
    loan('4', 'Ana Ríos', '2026-10-05T00:00:00', 'Paid'),
  ]

  // UI-16: "all" hides the cancelled loans; they only appear with the "Cancelled" status.
  it('keeps every status except Cancelled for "all"', () => {
    expect(ids(filterLoans(mixed, '', 'all', 'all'))).toEqual(['1', '2', '4'])
  })

  it('filters by a single status', () => {
    expect(ids(filterLoans(mixed, '', 'all', 'Paid'))).toEqual(['2', '4'])
    expect(ids(filterLoans(mixed, '', 'all', 'Cancelled'))).toEqual(['3'])
  })

  it('combines status with search and month (AND)', () => {
    expect(ids(filterLoans(mixed, 'ana', '2026-10', 'Paid'))).toEqual(['4'])
    expect(filterLoans(mixed, 'ana', '2026-09', 'Paid')).toEqual([])
  })

  it('counts loans per status over the whole list ("all" excludes the cancelled)', () => {
    expect(countLoansByStatus(mixed)).toEqual({ all: 3, Active: 1, Paid: 2, Cancelled: 1 })
  })
})

describe('borrower filter (spec 021)', () => {
  const two = [
    { ...loan('1', 'Luis Gálvez', '2026-10-03T00:00:00'), borrowerId: 'luis' },
    { ...loan('2', 'Ana Peña', '2026-09-01T00:00:00', 'Paid'), borrowerId: 'ana' },
    { ...loan('3', 'Ana Peña', '2026-10-05T00:00:00'), borrowerId: 'ana' },
  ]

  it('filters by borrower id and combines with the other filters (AND)', () => {
    expect(ids(filterLoans(two, '', 'all', 'all', 'ana'))).toEqual(['2', '3'])
    expect(ids(filterLoans(two, '', 'all', 'Active', 'ana'))).toEqual(['3'])
    expect(ids(filterLoans(two, '', '2026-09', 'all', 'ana'))).toEqual(['2'])
    expect(filterLoans(two, 'luis', 'all', 'all', 'ana')).toEqual([])
    expect(filterLoans(two, '', 'all', 'all', 'all')).toHaveLength(3)
  })

  it('lists unique borrowers A-Z with their loan counts', () => {
    expect(loanBorrowerOptions(two)).toEqual([
      { id: 'ana', name: 'Ana Peña', count: 2 },
      { id: 'luis', name: 'Luis Gálvez', count: 1 },
    ])
  })

  it('parses the status of the URL, unknown means all', () => {
    expect(parseLoanStatusFilter('Active')).toBe('Active')
    expect(parseLoanStatusFilter('Paid')).toBe('Paid')
    expect(parseLoanStatusFilter('xyz')).toBe('all')
    expect(parseLoanStatusFilter(null)).toBe('all')
  })
})

// UI-14
describe('loanStatusCounts', () => {
  const mixed = [
    loan('1', 'Ana Gallego', '2026-10-03T00:00:00'),
    loan('2', 'Luis Gálvez', '2026-10-20T00:00:00', 'Paid'),
    loan('3', 'Ana Peña', '2026-09-01T00:00:00'),
    loan('4', 'Ana Gallego', '2026-09-15T00:00:00', 'Cancelled'),
  ]

  it('equals the period totals when no filter is applied', () => {
    expect(loanStatusCounts(mixed, '', 'all', 'all')).toEqual(countLoansByStatus(mixed))
    expect(loanStatusCounts(mixed, '', 'all', 'all')).toEqual({ all: 3, Active: 2, Paid: 1, Cancelled: 1 })
  })

  it('follows the search, month and borrower filters', () => {
    expect(loanStatusCounts(mixed, 'ana', 'all', 'all')).toEqual({ all: 2, Active: 2, Paid: 0, Cancelled: 1 })
    expect(loanStatusCounts(mixed, '', '2026-10', 'all')).toEqual({ all: 2, Active: 1, Paid: 1, Cancelled: 0 })
    expect(loanStatusCounts(mixed, '', 'all', 'u-1')).toEqual({ all: 1, Active: 1, Paid: 0, Cancelled: 0 })
  })

  it('does not depend on the status filter itself', () => {
    expect(loanStatusCounts(mixed, '', '2026-09', 'all')).toEqual({ all: 1, Active: 1, Paid: 0, Cancelled: 1 })
  })
})

// UI-15
describe('loan filters from the URL', () => {
  it('parses the status (PascalCase)', () => {
    expect(parseLoanStatusFilter('Active')).toBe('Active')
    expect(parseLoanStatusFilter('active')).toBe('all')
    expect(parseLoanStatusFilter('xyz')).toBe('all')
    expect(parseLoanStatusFilter(null)).toBe('all')
  })

  it('parses the borrower and the month', () => {
    expect(parseLoanBorrowerFilter('u-1')).toBe('u-1')
    expect(parseLoanBorrowerFilter('')).toBe('all')
    expect(parseLoanMonthFilter('2026-03')).toBe('2026-03')
    expect(parseLoanMonthFilter('xyz')).toBe('all')
    expect(parseLoanMonthFilter(null)).toBe('all')
  })
})
