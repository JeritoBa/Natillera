import type { ActivityDetail } from '@/features/activities/api/activitiesApi'

export interface ActivitySummary {
  uPaid: number
  uPending: number
  uUnassigned: number
  collected: number
  outstanding: number
  gross: number
  net: number
  paidCount: number
  pendingCount: number
}

const round = (value: number) => Math.round(value * 100) / 100

export function getActivitySummary(activity: ActivityDetail): ActivitySummary {
  const active = activity.assignments.filter(item => item.status !== 'Cancelled')
  const paid = active.filter(item => item.status === 'Paid')
  const pending = active.filter(item => item.status === 'Pending')
  const units = (items: typeof active) => items.reduce((total, item) => total + item.quantityAssigned, 0)
  const amount = (items: typeof active) => round(items.reduce((total, item) => total + item.saleAmount, 0))
  const uPaid = units(paid)
  const collected = amount(paid)
  return {
    uPaid,
    uPending: units(pending),
    uUnassigned: activity.availableQuantity,
    collected,
    outstanding: amount(pending),
    gross: round(uPaid * (activity.unitSalePrice - activity.unitCost)),
    net: round(collected - activity.totalCost),
    paidCount: paid.length,
    pendingCount: pending.length,
  }
}
