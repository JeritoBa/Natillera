// LOAN-11: optional loan description, max 500 characters, trimmed; empty means "no description".
export const LOAN_DESCRIPTION_MAX_LENGTH = 500
const NEAR_LIMIT_FROM = 450

export type DescriptionCounterState = 'normal' | 'near' | 'limit'

/** Value sent to the API: trimmed text, or null when empty or whitespace-only. */
export function normalizeLoanDescription(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Counter state from the raw (untrimmed) length, as the textarea shows it. */
export function descriptionCounterState(length: number): DescriptionCounterState {
  if (length >= LOAN_DESCRIPTION_MAX_LENGTH) return 'limit'
  return length >= NEAR_LIMIT_FROM ? 'near' : 'normal'
}

/** True when the trimmed text fits the limit. */
export function isLoanDescriptionValid(value: string): boolean {
  return value.trim().length <= LOAN_DESCRIPTION_MAX_LENGTH
}
