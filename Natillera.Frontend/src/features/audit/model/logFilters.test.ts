import { describe, expect, it } from 'vitest'
import { filterLogs, logDayKey, parseLogActionFilter, parseLogDateFilter, parseLogEntityFilter } from '@/features/audit/model/logFilters'

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

// AUD-04 (mirror of the server contract, used by the public demo)
describe('filterLogs', () => {
  const log = (id: string, over: Partial<{ entityType: string, action: string, occurredAt: string, userName: string, entityId: string, oldValue: number | null, newValue: number | null }> = {}) => ({
    id, entityType: 'Loan', action: 'Create', occurredAt: '2026-03-10T15:00:00Z', userName: 'Ana Gómez', entityId: 'aaaa1111-0000-4000-8000-000000000001', oldValue: null, newValue: 50000, ...over,
  })
  const none = { q: '', entity: 'all', action: 'all', from: '', to: '' }
  const ids = (logs: { id: string }[]) => logs.map(item => item.id)

  it('keeps everything without filters', () => {
    expect(filterLogs([log('1'), log('2')], none)).toHaveLength(2)
  })

  it('filters by entity and action', () => {
    const logs = [log('1'), log('2', { entityType: 'Activity' }), log('3', { action: 'Delete' })]
    expect(ids(filterLogs(logs, { ...none, entity: 'Activity' }))).toEqual(['2'])
    expect(ids(filterLogs(logs, { ...none, action: 'Delete' }))).toEqual(['3'])
  })

  it('uses Colombia dates, inclusive on both ends', () => {
    // 2026-03-11 02:00 UTC is still March 10 in Colombia (UTC-5).
    const logs = [log('1', { occurredAt: '2026-03-11T02:00:00Z' }), log('2', { occurredAt: '2026-03-11T06:00:00Z' })]
    expect(logDayKey('2026-03-11T02:00:00Z')).toBe('2026-03-10')
    expect(ids(filterLogs(logs, { ...none, from: '2026-03-10', to: '2026-03-10' }))).toEqual(['1'])
    expect(ids(filterLogs(logs, { ...none, from: '2026-03-11' }))).toEqual(['2'])
  })

  it('searches the user name (case-insensitive) and the entity id', () => {
    const logs = [log('1'), log('2', { userName: 'Luis Ruiz', entityId: 'bbbb2222-0000-4000-8000-000000000002' })]
    expect(ids(filterLogs(logs, { ...none, q: ' ANA ' }))).toEqual(['1'])
    expect(ids(filterLogs(logs, { ...none, q: 'bbbb2222' }))).toEqual(['2'])
  })

  it('searches the exact old or new amount only when the text is digits only', () => {
    const logs = [log('1', { newValue: 50000 }), log('2', { oldValue: 50000, newValue: 60000 }), log('3', { newValue: 500000 })]
    expect(ids(filterLogs(logs, { ...none, q: '50000' }))).toEqual(['1', '2'])
    expect(filterLogs(logs, { ...none, q: '$50000' })).toEqual([])
  })
})
