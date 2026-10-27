import { describe, expect, it } from 'vitest'
import { proportionLabel, proportionSegments, sourceRows } from '@/features/dashboard/model/sourceBreakdown'

const summary = (paid: number, activities: number, pool: number, interest = pool, extra = 0) => ({
  paidMonthlyPayments: paid, activityEarnings: activities, sharedInterestPool: pool, loanInterestEarned: interest, paidExtraCosts: extra,
})

describe('source breakdown (DASH-13, DASH-03)', () => {
  it('DASH-13: three rows in order with the registered figures', () => {
    const rows = sourceRows(summary(950000, 40000, 10000))
    expect(rows.map(row => row.label)).toEqual(['Cuotas pagadas', 'Ganancias de actividades', 'Rendimientos de préstamos'])
    expect(rows.map(row => row.amount)).toEqual([950000, 40000, 10000])
    expect(rows.map(row => row.color)).toEqual(['#0c5c38', '#3f9b6b', '#9a6e00'])
  })

  it('DASH-12: the interest line mentions extra costs only when there are some', () => {
    expect(sourceRows(summary(0, 0, 6000, 10000, 4000))[2].detail).toMatch(/^Intereses pagados .* − costos extra /)
    expect(sourceRows(summary(0, 0, 10000))[2].detail).toBe('Intereses pagados')
  })

  it('DASH-13: only positive rows get a segment; percentages are Math.round per segment', () => {
    const segments = proportionSegments(sourceRows(summary(900, 50, 50)))
    expect(segments.map(segment => [segment.row.key, segment.percent])).toEqual([['fees', 90], ['activities', 5], ['interest', 5]])
    // 1/3 each rounds to 33% (the sum may be 99: documented behavior)
    expect(proportionSegments(sourceRows(summary(1, 1, 1))).map(segment => segment.percent)).toEqual([33, 33, 33])
  })

  it('DASH-13: a zero row has no segment and the bar uses the positive rows only', () => {
    const rows = sourceRows(summary(300, 0, 0))
    expect(rows[1].amount).toBe(0)
    expect(proportionSegments(rows).map(segment => segment.row.key)).toEqual(['fees'])
  })

  it('DASH-13: no positive row means no bar', () => {
    expect(proportionSegments(sourceRows(summary(0, 0, 0)))).toEqual([])
  })

  it('DASH-13: accessible label lists the positive rows', () => {
    expect(proportionLabel(proportionSegments(sourceRows(summary(900, 50, 50))))).toBe('Proporción: cuotas 90%, actividades 5%, rendimientos 5%')
  })
})
