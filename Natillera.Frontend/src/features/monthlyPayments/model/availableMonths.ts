// MP-10 / MP-04: months of a year in which a member has no non-cancelled fee.
export interface FeePeriod {
  id: string
  userId: string
  year: number
  month: number
  cancelled: boolean
}

export const isValidFeeYear = (year: number) => Number.isInteger(year) && year >= 1

export function getTakenMonths(fees: FeePeriod[], userId: string, year: number, excludeFeeId?: string): Set<number> {
  const taken = new Set<number>()
  for (const fee of fees) {
    if (fee.userId === userId && fee.year === year && !fee.cancelled && fee.id !== excludeFeeId) taken.add(fee.month)
  }
  return taken
}

export function getAvailableMonths(fees: FeePeriod[], userId: string, year: number, excludeFeeId?: string): number[] {
  if (!userId || !isValidFeeYear(year)) return []
  const taken = getTakenMonths(fees, userId, year, excludeFeeId)
  return Array.from({ length: 12 }, (_, index) => index + 1).filter(month => !taken.has(month))
}

export function getDefaultMonth(available: number[], today: Date): number | null {
  const current = today.getMonth() + 1
  if (available.includes(current)) return current
  return available[0] ?? null
}

export function resolveSelectedMonth(current: number | null, available: number[], today: Date): number | null {
  if (current !== null && available.includes(current)) return current
  return getDefaultMonth(available, today)
}
