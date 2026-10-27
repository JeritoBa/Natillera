import { describe, expect, it } from 'vitest'
import { activityStatusCounts, filterActivities, parseActivityMonthFilter, parseActivityStatusFilter } from '@/features/activities/model/activityFilters'

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

// UI-16
describe('activity status filter (UI-16)', () => {
  const activity = (id: string, startDate: string, status: 'Pending' | 'Finished' | 'Cancelled') => ({ id, startDate, status })
  const list = [
    activity('1', '2026-10-03T00:00:00', 'Pending'),
    activity('2', '2026-10-20T00:00:00', 'Finished'),
    activity('3', '2026-09-01T00:00:00', 'Cancelled'),
    activity('4', '2026-09-15T00:00:00', 'Pending'),
  ]
  const ids = (items: { id: string }[]) => items.map(item => item.id)

  it('"all" hides the cancelled activities; they appear only with "Cancelled"', () => {
    expect(ids(filterActivities(list, 'all', 'all'))).toEqual(['1', '2', '4'])
    expect(ids(filterActivities(list, 'all', 'Cancelled'))).toEqual(['3'])
    expect(ids(filterActivities(list, 'all', 'Finished'))).toEqual(['2'])
  })

  it('combines status and month', () => {
    expect(ids(filterActivities(list, '2026-09', 'all'))).toEqual(['4'])
    expect(ids(filterActivities(list, '2026-09', 'Cancelled'))).toEqual(['3'])
    expect(filterActivities(list, '2026-10', 'Cancelled')).toEqual([])
  })

  it('counts follow the month filter and "all" excludes the cancelled', () => {
    expect(activityStatusCounts(list, 'all')).toEqual({ all: 3, Pending: 2, Finished: 1, Cancelled: 1 })
    expect(activityStatusCounts(list, '2026-09')).toEqual({ all: 1, Pending: 1, Finished: 0, Cancelled: 1 })
  })

  it('parses the status from the URL; unknown values mean "Todas"', () => {
    expect(parseActivityStatusFilter('Cancelled')).toBe('Cancelled')
    expect(parseActivityStatusFilter('Finished')).toBe('Finished')
    expect(parseActivityStatusFilter('Pending')).toBe('Pending')
    expect(parseActivityStatusFilter('cancelled')).toBe('all')
    expect(parseActivityStatusFilter(null)).toBe('all')
  })
})
