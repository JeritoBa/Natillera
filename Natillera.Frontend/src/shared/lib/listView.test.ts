import { describe, expect, it } from 'vitest'
import { optionSource } from './listView'

// UI-16
describe('optionSource', () => {
  const records = [{ id: 1, cancelled: false }, { id: 2, cancelled: true }, { id: 3, cancelled: false }]
  const isCancelled = (record: { cancelled: boolean }) => record.cancelled

  it('keeps only live records by default', () => {
    expect(optionSource(records, isCancelled, false).map(record => record.id)).toEqual([1, 3])
  })

  it('keeps only cancelled records in the "Anulados" view', () => {
    expect(optionSource(records, isCancelled, true).map(record => record.id)).toEqual([2])
  })
})
