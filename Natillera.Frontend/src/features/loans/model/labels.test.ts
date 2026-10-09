import { describe, expect, it } from 'vitest'
import { formatDateOnly, longDate, methodLabel, toDateInput } from '@/features/loans/model/labels'

const normalize = (text: string) => text.replace(/\s+/g, ' ')

// Date-only values are parsed as local midnight, so results do not depend on the runner timezone.
describe('loans labels', () => {
  it('methodLabel translates payment methods', () => {
    expect(methodLabel).toEqual({ Cash: 'Efectivo', Transfer: 'Transferencia' })
  })

  it('toDateInput keeps only the yyyy-MM-dd part', () => {
    expect(toDateInput('2026-03-15T23:59:59Z')).toBe('2026-03-15')
    expect(toDateInput('2026-03-15')).toBe('2026-03-15')
  })

  it('formatDateOnly shows day/month/year in es-CO without timezone shift', () => {
    expect(formatDateOnly('2026-03-05')).toBe('5/3/2026')
    expect(formatDateOnly('2026-03-05T23:30:00-05:00')).toBe('5/3/2026')
    expect(formatDateOnly('2026-12-31T00:00:00Z')).toBe('31/12/2026')
  })

  it('longDate shows a long es-CO date', () => {
    expect(normalize(longDate('2026-03-05'))).toBe('5 de marzo de 2026')
    expect(normalize(longDate('2026-01-31T10:00:00Z'))).toBe('31 de enero de 2026')
  })
})
