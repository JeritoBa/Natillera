import { describe, expect, it } from 'vitest'
import { defaultDateForPeriod, isDateInPeriodYear, periodDateBounds, readStoredPeriodId, resolveSelectedPeriod, SAVING_PERIOD_STORAGE_KEY, sortPeriodsNewestFirst, writeStoredPeriodId } from '@/features/settings/model/savingPeriod'

const p2025 = { id: 'a', year: 2025 }
const p2026 = { id: 'b', year: 2026 }
const p2027 = { id: 'c', year: 2027 }

describe('resolveSelectedPeriod (PER-03)', () => {
  it('keeps a valid stored id', () => {
    expect(resolveSelectedPeriod([p2027, p2026, p2025], 'a', 2026)).toEqual({ period: p2025, notice: 'none' })
  })
  it('defaults to the current year when nothing is stored', () => {
    expect(resolveSelectedPeriod([p2027, p2026, p2025], null, 2026)).toEqual({ period: p2026, notice: 'none' })
  })
  it('falls back to the newest period with a notice when the current year has none', () => {
    expect(resolveSelectedPeriod([p2026, p2025], null, 2030)).toEqual({ period: p2026, notice: 'currentYearMissing' })
  })
  it('ignores an invalid stored id and uses the default', () => {
    expect(resolveSelectedPeriod([p2026, p2025], 'gone', 2026)).toEqual({ period: p2026, notice: 'none' })
  })
  it('returns no period when there are none', () => {
    expect(resolveSelectedPeriod([], 'a', 2026)).toEqual({ period: null, notice: 'none' })
  })
  it('sorts newest first', () => {
    expect(sortPeriodsNewestFirst([p2025, p2027, p2026]).map(p => p.year)).toEqual([2027, 2026, 2025])
  })
})

describe('stored period id', () => {
  it('reads and writes through the storage', () => {
    const data: Record<string, string> = {}
    const storage = { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v } }
    expect(readStoredPeriodId(storage)).toBeNull()
    writeStoredPeriodId('x', storage)
    expect(data[SAVING_PERIOD_STORAGE_KEY]).toBe('x')
    expect(readStoredPeriodId(storage)).toBe('x')
  })
  it('survives a storage that throws', () => {
    const storage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(readStoredPeriodId(storage)).toBeNull()
    expect(() => writeStoredPeriodId('x', storage)).not.toThrow()
  })
})

describe('period date helpers (PER-05)', () => {
  it('builds the year bounds', () => {
    expect(periodDateBounds(2026)).toEqual({ min: '2026-01-01', max: '2026-12-31' })
  })
  it('checks the year of a date', () => {
    expect(isDateInPeriodYear('2026-12-31', 2026)).toBe(true)
    expect(isDateInPeriodYear('2025-12-31', 2026)).toBe(false)
  })
  it('defaults to today only when it is inside the period year', () => {
    expect(defaultDateForPeriod(2026, new Date(2026, 2, 5))).toBe('2026-03-05')
    expect(defaultDateForPeriod(2025, new Date(2026, 2, 5))).toBe('')
  })
})
