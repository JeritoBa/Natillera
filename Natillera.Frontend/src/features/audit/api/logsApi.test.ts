import { describe, expect, it } from 'vitest'
import { buildLogQuery } from './logsApi'

// AUD-04
describe('buildLogQuery', () => {
  const none = { page: 1, q: '', entity: 'all', action: 'all', from: '', to: '' } as const

  it('omits default values', () => {
    expect(buildLogQuery(none)).toBe('')
    expect(buildLogQuery({ ...none, q: '   ' })).toBe('')
  })

  it('sends only the filters in use, with the text trimmed and encoded', () => {
    expect(buildLogQuery({ page: 2, q: ' José Pérez ', entity: 'Loan', action: 'Delete', from: '2026-01-01', to: '2026-01-31' }))
      .toBe('?page=2&q=Jos%C3%A9+P%C3%A9rez&entity=Loan&action=Delete&from=2026-01-01&to=2026-01-31')
  })
})
