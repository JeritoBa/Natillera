import { describe, expect, it } from 'vitest'
import { formatCurrency, formatMonth, formatShortCurrency } from '@/shared/lib/formatters'

// Intl may use a regular space, NBSP or narrow NBSP (all matched by \s) between symbol and digits depending on the ICU version.
const normalize = (text: string) => text.replace(/\s+/g, ' ')

describe('formatCurrency', () => {
  it('formats COP with dot thousands separators and no decimals', () => {
    expect(normalize(formatCurrency(1234567))).toBe('$ 1.234.567')
  })

  it('formats zero', () => {
    expect(normalize(formatCurrency(0))).toBe('$ 0')
  })

  it('drops the sign (uses the absolute value)', () => {
    expect(formatCurrency(-50000)).toBe(formatCurrency(50000))
    expect(normalize(formatCurrency(-50000))).not.toContain('-')
  })

  it('rounds to whole pesos', () => {
    expect(normalize(formatCurrency(1000.4))).toBe('$ 1.000')
  })
})

describe('formatShortCurrency', () => {
  it('uses M for millions with one decimal', () => {
    expect(formatShortCurrency(1_500_000)).toBe('$1.5M')
    expect(formatShortCurrency(1_000_000)).toBe('$1.0M')
  })

  it('uses K for thousands without decimals', () => {
    expect(formatShortCurrency(1_000)).toBe('$1K')
    expect(formatShortCurrency(25_400)).toBe('$25K')
  })

  it('shows the plain value below one thousand', () => {
    expect(formatShortCurrency(999)).toBe('$999')
    expect(formatShortCurrency(0)).toBe('$0')
  })
})

describe('formatMonth', () => {
  it('maps 1..12 to Spanish month names', () => {
    expect(formatMonth(1)).toBe('Enero')
    expect(formatMonth(10)).toBe('Octubre')
    expect(formatMonth(12)).toBe('Diciembre')
  })

  it('falls back to the number as string when out of range', () => {
    expect(formatMonth(0)).toBe('0')
    expect(formatMonth(13)).toBe('13')
  })
})
