import { describe, expect, it } from 'vitest'
import { parseLogActionFilter, parseLogDateFilter, parseLogEntityFilter } from '@/features/audit/model/logFilters'

// UI-15
describe('log filters from the URL', () => {
  it('parses the entity against the known enum', () => {
    expect(parseLogEntityFilter('Loan')).toBe('Loan')
    expect(parseLogEntityFilter('xyz')).toBe('all')
    expect(parseLogEntityFilter(null)).toBe('all')
  })

  it('parses the action against the known enum', () => {
    expect(parseLogActionFilter('Create')).toBe('Create')
    expect(parseLogActionFilter('create')).toBe('all')
    expect(parseLogActionFilter(null)).toBe('all')
  })

  it('parses the dates', () => {
    expect(parseLogDateFilter('2026-03-15')).toBe('2026-03-15')
    expect(parseLogDateFilter('2026-02-30')).toBe('')
    expect(parseLogDateFilter(null)).toBe('')
  })
})
