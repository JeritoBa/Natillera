import { describe, expect, it } from 'vitest'
import type { ExtraCost, ExtraCostStatus } from '@/features/activities/api/activitiesApi'
import { extraCostCounterState, extraCostTotals, sortExtraCosts, validateExtraCostForm } from '@/features/activities/model/extraCosts'

let counter = 0
const cost = (status: ExtraCostStatus, amount: number, createdAt = '2026-03-01T10:00:00Z'): ExtraCost => ({
  id: `c-${++counter}`, activityId: 'a1', description: 'Domicilio', amount, status, createdAt,
  paidAt: status === 'Paid' ? createdAt : null, transactionId: status === 'Paid' ? `t-${counter}` : null,
})

describe('extraCostTotals (ACT-13)', () => {
  it('is zero without extra costs', () => {
    expect(extraCostTotals([])).toEqual({ paid: 0, pending: 0, activeCount: 0 })
  })

  it('sums paid and pending separately and ignores cancelled ones', () => {
    const totals = extraCostTotals([cost('Paid', 5000), cost('Paid', 2500), cost('Pending', 1000), cost('Cancelled', 99999)])
    expect(totals).toEqual({ paid: 7500, pending: 1000, activeCount: 3 })
  })
})

describe('sortExtraCosts', () => {
  it('orders Pending, Paid, Cancelled and then by creation date', () => {
    const cancelled = cost('Cancelled', 1, '2026-03-01T10:00:00Z')
    const paidLate = cost('Paid', 2, '2026-03-05T10:00:00Z')
    const paidEarly = cost('Paid', 3, '2026-03-02T10:00:00Z')
    const pending = cost('Pending', 4, '2026-03-09T10:00:00Z')
    const input = [cancelled, paidLate, paidEarly, pending]

    expect(sortExtraCosts(input)).toEqual([pending, paidEarly, paidLate, cancelled])
    expect(input[0]).toBe(cancelled) // the input is not mutated
  })
})

describe('validateExtraCostForm', () => {
  it('accepts a description and a positive amount', () => {
    expect(validateExtraCostForm('Domicilio', '20000')).toBeNull()
  })

  it('requires a description after trimming', () => {
    expect(validateExtraCostForm('   ', '20000')).toBe('Escribe una descripción.')
  })

  it('rejects descriptions over 200 characters', () => {
    expect(validateExtraCostForm('a'.repeat(201), '20000')).toMatch(/200/)
    expect(validateExtraCostForm('a'.repeat(200), '20000')).toBeNull()
  })

  it.each(['', '0', '-5', 'abc'])('rejects the amount "%s"', amount => {
    expect(validateExtraCostForm('Domicilio', amount)).toBe('Ingresa un monto mayor que cero.')
  })
})

describe('extraCostCounterState', () => {
  it('is normal, near from 180 and limit at 200', () => {
    expect(extraCostCounterState(179)).toBe('normal')
    expect(extraCostCounterState(180)).toBe('near')
    expect(extraCostCounterState(199)).toBe('near')
    expect(extraCostCounterState(200)).toBe('limit')
  })
})
