// PER-03 / PER-08: which saving period the app shows. Pure logic; storage helpers are injectable for tests.
export interface SavingPeriod {
  id: string
  year: number
}

export type PeriodNotice = 'none' | 'currentYearMissing'

export interface ResolvedPeriod {
  period: SavingPeriod | null
  notice: PeriodNotice
}

export const SAVING_PERIOD_STORAGE_KEY = 'natillera.savingPeriodId'

export const sortPeriodsNewestFirst = (periods: SavingPeriod[]) => [...periods].sort((a, b) => b.year - a.year)

// A valid stored id wins; otherwise the current year; otherwise the newest period with a notice.
export function resolveSelectedPeriod(periods: SavingPeriod[], storedId: string | null, currentYear: number): ResolvedPeriod {
  if (periods.length === 0) return { period: null, notice: 'none' }
  const stored = storedId ? periods.find(period => period.id === storedId) : undefined
  if (stored) return { period: stored, notice: 'none' }
  const current = periods.find(period => period.year === currentYear)
  if (current) return { period: current, notice: 'none' }
  return { period: sortPeriodsNewestFirst(periods)[0], notice: 'currentYearMissing' }
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const defaultStorage = (): StorageLike | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export function readStoredPeriodId(storage: StorageLike | null = defaultStorage()): string | null {
  try { return storage?.getItem(SAVING_PERIOD_STORAGE_KEY) ?? null } catch { return null }
}

export function writeStoredPeriodId(id: string, storage: StorageLike | null = defaultStorage()) {
  try { storage?.setItem(SAVING_PERIOD_STORAGE_KEY, id) } catch { /* Storage unavailable: the choice is not persisted. */ }
}

// PER-05 (client side): the start date of a loan or activity must fall inside the period year.
export const periodDateBounds = (year: number) => ({ min: `${year}-01-01`, max: `${year}-12-31` })

export const isDateInPeriodYear = (date: string, year: number) => date.slice(0, 4) === String(year)

// Default form date: today when it is inside the period year, otherwise empty.
export const defaultDateForPeriod = (year: number, today: Date) => {
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return isDateInPeriodYear(iso, year) ? iso : ''
}
