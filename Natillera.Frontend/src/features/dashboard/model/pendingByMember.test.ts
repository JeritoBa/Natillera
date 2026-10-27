import { describe, expect, it } from 'vitest'
import type { MemberPendingObligations } from '@/features/dashboard/api/dashboardApi'
import {
  filterPendingByMember, parsePendingFilter, pendingAmountPath, pendingColumnTotals, pendingCountLine, pendingFilterCounts,
  pendingMainAmount, pendingShownLabel, resolvePendingFilter,
} from '@/features/dashboard/model/pendingByMember'

const none = { count: 0, amount: 0 }
const row = (name: string, parts: Partial<Pick<MemberPendingObligations, 'monthlyPayments' | 'loans' | 'interests' | 'activitySales'>>): MemberPendingObligations => {
  const full = { monthlyPayments: none, loans: none, interests: none, activitySales: none, ...parts }
  const total = full.monthlyPayments.amount + full.loans.amount + full.interests.amount + full.activitySales.amount
  return { userId: `u-${name}`, memberName: name, isActive: true, total, ...full }
}

const rows = [
  row('Zoe', { monthlyPayments: { count: 2, amount: 60000 } }),
  row('Ana', { monthlyPayments: { count: 1, amount: 30000 }, interests: { count: 1, amount: 4000 } }),
  row('Carlos', { loans: { count: 1, amount: 200000 }, interests: { count: 1, amount: 4000 } }),
  row('Beto', { monthlyPayments: { count: 2, amount: 60000 } }),
  row('Nadie', {}),
]
const names = (list: MemberPendingObligations[]) => list.map(item => item.memberName)

describe('pending by member (DASH-14)', () => {
  it('"Todos": total > 0 ordered by total desc, then name', () => {
    expect(names(filterPendingByMember(rows, 'all'))).toEqual(['Carlos', 'Beto', 'Zoe', 'Ana'])
  })

  it('a kind: only members with an amount in it, by that amount desc, then name', () => {
    expect(names(filterPendingByMember(rows, 'monthlyPayments'))).toEqual(['Beto', 'Zoe', 'Ana'])
    expect(names(filterPendingByMember(rows, 'interests'))).toEqual(['Ana', 'Carlos'])
    expect(names(filterPendingByMember(rows, 'loans'))).toEqual(['Carlos'])
    expect(filterPendingByMember(rows, 'activitySales')).toEqual([])
  })

  it('counts the members each filter would show', () => {
    expect(pendingFilterCounts(rows)).toEqual({ all: 4, monthlyPayments: 3, loans: 1, interests: 2, activitySales: 0 })
  })

  it('a filter with 0 members resolves to "Todos"', () => {
    const counts = pendingFilterCounts(rows)
    expect(resolvePendingFilter('activitySales', counts)).toBe('all')
    expect(resolvePendingFilter('interests', counts)).toBe('interests')
  })

  it('parses the URL value; unknown or missing means "Todos"', () => {
    expect(parsePendingFilter('interests')).toBe('interests')
    expect(parsePendingFilter('xyz')).toBe('all')
    expect(parsePendingFilter('all')).toBe('all')
    expect(parsePendingFilter(null)).toBe('all')
  })

  it('main amount is the total in "Todos" and the kind amount otherwise', () => {
    expect(pendingMainAmount(rows[2], 'all')).toBe(204000)
    expect(pendingMainAmount(rows[2], 'interests')).toBe(4000)
  })

  it('column totals are the sum of the visible rows', () => {
    expect(pendingColumnTotals(filterPendingByMember(rows, 'interests'))).toEqual({
      monthlyPayments: 30000, loans: 200000, interests: 8000, activitySales: 0, total: 238000,
    })
    expect(pendingColumnTotals([row('A', { monthlyPayments: { count: 1, amount: 0.1 } }), row('B', { monthlyPayments: { count: 1, amount: 0.2 } })]).total).toBe(0.3)
  })

  it('count line: non-zero kinds with plurals in "Todos", count and total for a kind', () => {
    expect(pendingCountLine(rows[1], 'all')).toBe('1 cuota · 1 interés')
    expect(pendingCountLine(rows[0], 'all')).toBe('2 cuotas')
    expect(pendingCountLine(row('X', { loans: { count: 2, amount: 1 }, activitySales: { count: 1, amount: 1 } }), 'all')).toBe('2 préstamos · 1 venta')
    expect(pendingCountLine(rows[1], 'interests')).toMatch(/^1 interés · Total \$\s34\.000$/)
    expect(pendingCountLine(rows[0], 'monthlyPayments')).toMatch(/^2 cuotas · Total /)
  })

  it('amount links lead to the list or the member detail', () => {
    expect(pendingAmountPath('monthlyPayments', 'u1')).toBe('/payments?member=u1&status=pending')
    expect(pendingAmountPath('loans', 'u1')).toBe('/loans?borrower=u1&status=Active')
    expect(pendingAmountPath('interests', 'u1')).toBe('/members/u1#pendientes')
    expect(pendingAmountPath('activitySales', 'u1')).toBe('/members/u1#pendientes')
    expect(pendingAmountPath('total', 'u1')).toBe('/members/u1#pendientes')
  })

  it('shown label', () => {
    expect(pendingShownLabel(2, 4)).toBe('Mostrando 2 de 4 miembros con pendientes')
  })
})
