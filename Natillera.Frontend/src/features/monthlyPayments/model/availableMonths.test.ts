import { describe, expect, it } from 'vitest'
import { getAvailableMonths, getDefaultMonth, getTakenMonths, resolveSelectedMonth, type FeePeriod } from '@/features/monthlyPayments/model/availableMonths'

const fee = (id: string, userId: string, year: number, month: number, cancelled = false): FeePeriod => ({ id, userId, year, month, cancelled })
const all = Array.from({ length: 12 }, (_, i) => i + 1)
const today = new Date(2026, 9, 14)

const fees: FeePeriod[] = [
  fee('oct', 'A', 2026, 10),
  fee('nov', 'A', 2026, 11),
  fee('dec', 'A', 2026, 12, true),
]

describe('getAvailableMonths', () => {
  it('MP-10 hides Paid and Pending months and offers Cancelled and future ones', () => {
    expect(getAvailableMonths(fees, 'A', 2026)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 12])
  })

  it('MP-10 does not block another member', () => {
    expect(getAvailableMonths(fees, 'B', 2026)).toEqual(all)
  })

  it('MP-10 does not block another year', () => {
    expect(getAvailableMonths(fees, 'A', 2027)).toEqual(all)
  })

  it('MP-10 edit: the fee being edited never blocks itself, others still do', () => {
    const months = getAvailableMonths(fees, 'A', 2026, 'oct')
    expect(months).toContain(10)
    expect(months).not.toContain(11)
  })

  it('MP-10 edit with a different year offers all months', () => {
    expect(getAvailableMonths(fees, 'A', 2027, 'oct')).toEqual(all)
  })

  it('MP-10 returns nothing when all 12 months are taken', () => {
    const full = all.map(m => fee(`f${m}`, 'A', 2026, m))
    expect(getAvailableMonths(full, 'A', 2026)).toEqual([])
  })

  it('MP-04 a cancelled fee frees only its own month', () => {
    const full = all.map(m => fee(`f${m}`, 'A', 2026, m, m !== 5))
    expect(getAvailableMonths(full, 'A', 2026)).toEqual(all.filter(m => m !== 5))
  })

  it('MP-04 a single cancelled fee among 12 leaves only that month', () => {
    const full = all.map(m => fee(`f${m}`, 'A', 2026, m, m === 5))
    expect(getAvailableMonths(full, 'A', 2026)).toEqual([5])
  })

  it('returns nothing without a member', () => {
    expect(getAvailableMonths(fees, '', 2026)).toEqual([])
  })

  it('returns nothing for an invalid year', () => {
    for (const year of [0, -1, Number.NaN, 2026.5]) expect(getAvailableMonths(fees, 'B', year)).toEqual([])
  })

  it('is ascending without duplicates when a month has cancelled and paid fees', () => {
    const list = [fee('a', 'A', 2026, 3, true), fee('b', 'A', 2026, 3)]
    const months = getAvailableMonths(list, 'A', 2026)
    expect(months).not.toContain(3)
    expect(months).toEqual([...new Set(months)].sort((x, y) => x - y))
  })
})

describe('getTakenMonths', () => {
  it('MP-04 collects Paid and Pending months only', () => {
    expect(getTakenMonths(fees, 'A', 2026)).toEqual(new Set([10, 11]))
  })
})

describe('getDefaultMonth', () => {
  it('uses the current month when available', () => {
    expect(getDefaultMonth(all, today)).toBe(10)
  })

  it('falls back to the earliest available month', () => {
    expect(getDefaultMonth([3, 4], today)).toBe(3)
  })

  it('returns null when nothing is available', () => {
    expect(getDefaultMonth([], today)).toBeNull()
  })
})

describe('resolveSelectedMonth', () => {
  it('keeps the current selection when still available', () => {
    expect(resolveSelectedMonth(4, [3, 4], today)).toBe(4)
  })

  it('applies the default when the selection is no longer available', () => {
    expect(resolveSelectedMonth(10, [3, 4], today)).toBe(3)
  })

  it('applies the default when nothing is selected', () => {
    expect(resolveSelectedMonth(null, all, today)).toBe(10)
  })

  it('returns null when nothing is available', () => {
    expect(resolveSelectedMonth(4, [], today)).toBeNull()
  })
})
