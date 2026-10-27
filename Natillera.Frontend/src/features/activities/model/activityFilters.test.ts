import { describe, expect, it } from 'vitest'
import { parseActivityMonthFilter } from '@/features/activities/model/activityFilters'

// UI-15
describe('parseActivityMonthFilter', () => {
  it('accepts a YYYY-MM month', () => {
    expect(parseActivityMonthFilter('2026-03')).toBe('2026-03')
  })

  it('treats invalid or missing values as "Todos"', () => {
    expect(parseActivityMonthFilter('2026-13')).toBe('all')
    expect(parseActivityMonthFilter('xyz')).toBe('all')
    expect(parseActivityMonthFilter(null)).toBe('all')
  })
})
