import type { ExtraCost, ExtraCostStatus } from '@/features/activities/api/activitiesApi'

// ACT-13..15: extra costs of an activity. They never change the activity's own figures (see activitySummary.ts).
export const EXTRA_COST_DESCRIPTION_MAX_LENGTH = 200
const NEAR_LIMIT_FROM = 180

export type ExtraCostCounterState = 'normal' | 'near' | 'limit'

/** Counter state from the raw (untrimmed) length, as the input shows it. */
export function extraCostCounterState(length: number): ExtraCostCounterState {
  if (length >= EXTRA_COST_DESCRIPTION_MAX_LENGTH) return 'limit'
  return length >= NEAR_LIMIT_FROM ? 'near' : 'normal'
}

/** Paid and pending totals; cancelled extra costs are ignored. */
export function extraCostTotals(extraCosts: ExtraCost[]): { paid: number; pending: number; activeCount: number } {
  let paid = 0
  let pending = 0
  let activeCount = 0
  for (const cost of extraCosts) {
    if (cost.status === 'Cancelled') continue
    activeCount++
    if (cost.status === 'Paid') paid += cost.amount
    else pending += cost.amount
  }
  return { paid, pending, activeCount }
}

const statusOrder: Record<ExtraCostStatus, number> = { Pending: 0, Paid: 1, Cancelled: 2 }

/** Pending first, then Paid, then Cancelled; oldest first inside each status. */
export function sortExtraCosts(extraCosts: ExtraCost[]): ExtraCost[] {
  return [...extraCosts].sort((a, b) =>
    statusOrder[a.status] - statusOrder[b.status] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

/** Returns the first validation message of the form, or null when it is valid. */
export function validateExtraCostForm(description: string, amount: string): string | null {
  if (!description.trim()) return 'Escribe una descripción.'
  if (description.trim().length > EXTRA_COST_DESCRIPTION_MAX_LENGTH) return `La descripción no puede superar ${EXTRA_COST_DESCRIPTION_MAX_LENGTH} caracteres.`
  const numeric = Number(amount)
  if (amount === '' || !Number.isFinite(numeric) || numeric <= 0) return 'Ingresa un monto mayor que cero.'
  return null
}
