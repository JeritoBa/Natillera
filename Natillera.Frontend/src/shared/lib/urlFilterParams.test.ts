import { describe, expect, it } from 'vitest'
import { parseIdParam, parseIsoDate, parseMonthKey, parseOneOf, syncTextDraft, withFilterParam, withParam, withoutParams } from './urlFilterParams'

// UI-15
describe('withParam', () => {
  it('sets a value and keeps the other keys', () => {
    expect(withParam(new URLSearchParams('status=Active'), 'month', '2026-03', 'all').toString()).toBe('status=Active&month=2026-03')
  })

  it('removes the key for the default value and for an empty value', () => {
    expect(withParam(new URLSearchParams('month=2026-03&q=ana'), 'month', 'all', 'all').toString()).toBe('q=ana')
    expect(withParam(new URLSearchParams('q=ana'), 'q', '', '').toString()).toBe('')
  })

  it('does not mutate the current params', () => {
    const current = new URLSearchParams('a=1')
    withParam(current, 'a', '2', 'all')
    expect(current.toString()).toBe('a=1')
  })
})

describe('withoutParams', () => {
  it('removes only the given keys', () => {
    expect(withoutParams(new URLSearchParams('q=ana&month=2026-03&other=x'), ['q', 'month']).toString()).toBe('other=x')
  })
})

describe('parseMonthKey', () => {
  it('accepts a real YYYY-MM', () => {
    expect(parseMonthKey('2026-03')).toBe('2026-03')
  })

  it('rejects invalid or missing values', () => {
    expect(parseMonthKey('2026-13')).toBe('all')
    expect(parseMonthKey('2026-3')).toBe('all')
    expect(parseMonthKey('xyz')).toBe('all')
    expect(parseMonthKey(null)).toBe('all')
    expect(parseMonthKey(undefined)).toBe('all')
  })
})

describe('parseIsoDate', () => {
  it('accepts a real date', () => {
    expect(parseIsoDate('2026-02-28')).toBe('2026-02-28')
  })

  it('rejects dates that do not exist and malformed values', () => {
    expect(parseIsoDate('2026-02-30')).toBe('')
    expect(parseIsoDate('2026-2-3')).toBe('')
    expect(parseIsoDate('abc')).toBe('')
    expect(parseIsoDate(null)).toBe('')
  })
})

describe('parseIdParam', () => {
  it('keeps a non-empty id and defaults to "all"', () => {
    expect(parseIdParam('abc-1')).toBe('abc-1')
    expect(parseIdParam('')).toBe('all')
    expect(parseIdParam('  ')).toBe('all')
    expect(parseIdParam(null)).toBe('all')
  })
})

describe('parseOneOf', () => {
  const parse = parseOneOf(['active', 'inactive'] as const)

  it('accepts the listed values only', () => {
    expect(parse('active')).toBe('active')
    expect(parse('Active')).toBe('all')
    expect(parse('xyz')).toBe('all')
    expect(parse(null)).toBe('all')
  })
})

describe('syncTextDraft', () => {
  it('keeps the typed text while the URL has not caught up', () => {
    const draft = { text: 'ana', synced: '' }
    expect(syncTextDraft(draft, '')).toBe(draft)
  })

  it('marks the draft as synced when the URL reaches the typed text', () => {
    expect(syncTextDraft({ text: 'ana', synced: '' }, 'ana')).toEqual({ text: 'ana', synced: 'ana' })
  })

  it('adopts the URL when it changes on its own', () => {
    expect(syncTextDraft({ text: 'ana', synced: 'ana' }, 'luis')).toEqual({ text: 'luis', synced: 'luis' })
    expect(syncTextDraft({ text: 'ana', synced: 'ana' }, '')).toEqual({ text: '', synced: '' })
  })
})

// UI-17
describe('withFilterParam', () => {
  it('sets the filter and removes page in the same update', () => {
    expect(withFilterParam(new URLSearchParams('type=Loan&page=3'), 'month', '2026-03', 'all').toString()).toBe('type=Loan&month=2026-03')
  })

  it('removes page when the filter goes back to its default', () => {
    expect(withFilterParam(new URLSearchParams('month=2026-03&page=2'), 'month', 'all', 'all').toString()).toBe('')
  })

  it('keeps the other filters and does not mutate the current params', () => {
    const current = new URLSearchParams('q=ana&page=2')
    expect(withFilterParam(current, 'entity', 'Loan', 'all').toString()).toBe('q=ana&entity=Loan')
    expect(current.toString()).toBe('q=ana&page=2')
  })
})
