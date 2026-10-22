import { describe, expect, it } from 'vitest'
import { descriptionCounterState, isLoanDescriptionValid, normalizeLoanDescription } from './loanDescription'

describe('loan description (LOAN-11)', () => {
  it('trims the text and keeps inner line breaks', () => {
    expect(normalizeLoanDescription('  Para la moto.\nPaga el 15.  ')).toBe('Para la moto.\nPaga el 15.')
  })

  it('sends null for empty or whitespace-only text', () => {
    expect(normalizeLoanDescription('')).toBeNull()
    expect(normalizeLoanDescription('  \n  ')).toBeNull()
  })

  it('accepts exactly 500 characters and rejects 501 after trimming', () => {
    expect(isLoanDescriptionValid('a'.repeat(500))).toBe(true)
    expect(isLoanDescriptionValid(`  ${'a'.repeat(500)}  `)).toBe(true)
    expect(isLoanDescriptionValid('a'.repeat(501))).toBe(false)
  })

  it('maps the length to the counter state', () => {
    expect(descriptionCounterState(0)).toBe('normal')
    expect(descriptionCounterState(449)).toBe('normal')
    expect(descriptionCounterState(450)).toBe('near')
    expect(descriptionCounterState(499)).toBe('near')
    expect(descriptionCounterState(500)).toBe('limit')
  })
})
