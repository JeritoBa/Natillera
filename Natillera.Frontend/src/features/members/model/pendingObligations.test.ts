import { describe, expect, it } from 'vitest'
import type { PendingObligations } from '@/features/members/api/membersApi'
import { assignmentPath, feePath, hasPendingObligations, interestPath, loanPath, pendingKinds, pendingSumLabel } from '@/features/members/model/pendingObligations'

const empty: PendingObligations = {
  total: 0,
  monthlyPayments: { count: 0, amount: 0, items: [] },
  loans: { count: 0, amount: 0, items: [] },
  interests: { count: 0, amount: 0, items: [] },
  activitySales: { count: 0, amount: 0, items: [] },
}

describe('pending obligations model (MEM-10, DASH-11)', () => {
  it('nothing pending: no kinds and no pending obligations', () => {
    expect(pendingKinds(empty)).toEqual([])
    expect(hasPendingObligations(empty)).toBe(false)
    expect(hasPendingObligations(null)).toBe(false)
    expect(hasPendingObligations(undefined)).toBe(false)
  })

  it('keeps a fixed order and drops kinds with count 0', () => {
    const o: PendingObligations = {
      ...empty,
      activitySales: { count: 1, amount: 80000, items: [] },
      monthlyPayments: { count: 2, amount: 100000, items: [] },
    }
    expect(pendingKinds(o).map(kind => kind.label)).toEqual(['Cuotas', 'Ventas de actividades'])
    expect(pendingKinds(o).map(kind => kind.amount)).toEqual([100000, 80000])
    expect(hasPendingObligations(o)).toBe(true)
  })

  it('lists the four kinds in order', () => {
    const group = { count: 1, amount: 1, items: [] }
    const o: PendingObligations = { total: 4, monthlyPayments: group, loans: group, interests: group, activitySales: group }
    expect(pendingKinds(o).map(kind => kind.label)).toEqual(['Cuotas', 'Préstamos (capital)', 'Intereses', 'Ventas de actividades'])
  })

  it('words the sum of pending payments with singular and plural', () => {
    const one = { count: 1, amount: 1, items: [] }
    expect(pendingSumLabel({ ...empty, monthlyPayments: one })).toBe('Suma de 1 pago pendiente')
    expect(pendingSumLabel({ ...empty, monthlyPayments: { ...one, count: 2 }, loans: one })).toBe('Suma de 3 pagos pendientes')
  })

  it('builds the admin fee path filtered by member, month and pending status', () => {
    expect(feePath('m1', 2026, 10)).toBe('/payments?member=m1&month=2026-10&status=pending')
    expect(feePath('m1', 2026, 3)).toBe('/payments?member=m1&month=2026-03&status=pending')
  })

  it('builds detail paths', () => {
    expect(loanPath('l1')).toBe('/loans/l1')
    expect(interestPath('l1', 'i1')).toBe('/loans/l1/interest-payments/i1')
    expect(assignmentPath('a1', 's1')).toBe('/activities/a1/assignments/s1')
  })
})
