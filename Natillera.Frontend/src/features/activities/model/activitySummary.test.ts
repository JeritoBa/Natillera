import { describe, expect, it } from 'vitest'
import type { ActivityAssignmentResponse, ActivityDetail, AssignmentStatus } from '@/features/activities/api/activitiesApi'
import { getActivitySummary } from '@/features/activities/model/activitySummary'

let counter = 0
const assignment = (status: AssignmentStatus, quantityAssigned: number, saleAmount: number): ActivityAssignmentResponse => ({
  id: `as-${++counter}`, activityId: 'a1', userId: 'u1', memberName: 'Ana', quantityAssigned, saleAmount, status,
  assignedAt: '2026-01-01', paidAt: status === 'Paid' ? '2026-01-02' : null, transactionId: null,
})

const activity = (assignments: ActivityAssignmentResponse[], overrides: Partial<ActivityDetail> = {}): ActivityDetail => ({
  id: 'a1', name: 'Rifa', description: '', quantity: 100, unitCost: 1000, unitSalePrice: 2500, totalCost: 100000,
  assignedQuantity: 0, availableQuantity: 100, startDate: '2026-01-01', status: 'Pending',
  transactionId: 't1', createdAt: '2026-01-01', assignments, ...overrides,
})

describe('getActivitySummary', () => {
  it('returns zeros and negative net (= -totalCost) when there are no assignments', () => {
    const s = getActivitySummary(activity([]))
    expect(s).toEqual({
      uPaid: 0, uPending: 0, uUnassigned: 100, collected: 0, outstanding: 0, gross: 0, net: -100000, paidCount: 0, pendingCount: 0,
    })
  })

  it('sums paid as collected and pending as outstanding', () => {
    const s = getActivitySummary(activity([
      assignment('Paid', 10, 25000), assignment('Paid', 5, 12500), assignment('Pending', 20, 50000),
    ]))
    expect(s.collected).toBe(37500)
    expect(s.outstanding).toBe(50000)
    expect(s.uPaid).toBe(15)
    expect(s.uPending).toBe(20)
    expect(s.paidCount).toBe(2)
    expect(s.pendingCount).toBe(1)
  })

  it('ignores cancelled assignments everywhere', () => {
    const s = getActivitySummary(activity([assignment('Cancelled', 50, 125000), assignment('Paid', 1, 2500)]))
    expect(s.collected).toBe(2500)
    expect(s.outstanding).toBe(0)
    expect(s.uPaid).toBe(1)
    expect(s.uPending).toBe(0)
    expect(s.paidCount + s.pendingCount).toBe(1)
  })

  it('computes gross as paid units x (price - cost)', () => {
    const s = getActivitySummary(activity([assignment('Paid', 10, 25000), assignment('Pending', 90, 225000)]))
    expect(s.gross).toBe(15000)
  })

  it('computes net as collected minus total cost, negative or positive', () => {
    expect(getActivitySummary(activity([assignment('Paid', 10, 25000)])).net).toBe(-75000)
    expect(getActivitySummary(activity([assignment('Paid', 60, 150000)])).net).toBe(50000)
  })

  it('exposes availableQuantity as unassigned units', () => {
    expect(getActivitySummary(activity([], { availableQuantity: 7 })).uUnassigned).toBe(7)
  })

  it('rounds money values to 2 decimals', () => {
    const s = getActivitySummary(activity(
      [assignment('Paid', 1, 0.1), assignment('Paid', 1, 0.2), assignment('Pending', 1, 0.1), assignment('Pending', 1, 0.2)],
      { totalCost: 0, unitCost: 0.333, unitSalePrice: 1.0 },
    ))
    expect(s.collected).toBe(0.3)
    expect(s.outstanding).toBe(0.3)
    expect(s.gross).toBe(1.33) // 2 units x (1 - 0.333) = 1.334
  })
})
