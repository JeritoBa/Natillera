import { describe, expect, it } from 'vitest'
import { normalizeSearch } from '@/shared/lib/search'

describe('normalizeSearch', () => {
  it('lowercases', () => {
    expect(normalizeSearch('GALLEGO')).toBe('gallego')
  })

  it('strips diacritics', () => {
    expect(normalizeSearch('Gálvez')).toBe('galvez')
    expect(normalizeSearch('Peña')).toBe('pena')
    expect(normalizeSearch('Müller')).toBe('muller')
    expect(normalizeSearch('ÁÉÍÓÚ')).toBe('aeiou')
  })

  it('leaves digits, @, dots, spaces and plus signs', () => {
    expect(normalizeSearch('+57 312 a@b.co')).toBe('+57 312 a@b.co')
  })

  it('handles the empty string', () => {
    expect(normalizeSearch('')).toBe('')
  })

  it('is idempotent', () => {
    const once = normalizeSearch('Ñandú Éxito')
    expect(normalizeSearch(once)).toBe(once)
  })
})
