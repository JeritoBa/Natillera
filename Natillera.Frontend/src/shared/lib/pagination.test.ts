import { describe, expect, it } from 'vitest'
import { pageRange, parsePageParam } from './pagination'

// UI-17
describe('parsePageParam', () => {
  it('accepts positive integers', () => {
    expect(parsePageParam('1')).toBe(1)
    expect(parsePageParam('7')).toBe(7)
    expect(parsePageParam('99')).toBe(99)
  })

  it('falls back to page 1 for anything else', () => {
    for (const value of [null, undefined, '', '0', '-2', '1.5', 'abc', '2x', ' 3', '99999999999999999999']) expect(parsePageParam(value)).toBe(1)
  })
})

describe('pageRange', () => {
  it('describes the first, a middle and the last (partial) page', () => {
    expect(pageRange(1, 50, 120)).toEqual({ from: 1, to: 50, totalPages: 3 })
    expect(pageRange(2, 50, 120)).toEqual({ from: 51, to: 100, totalPages: 3 })
    expect(pageRange(3, 50, 120)).toEqual({ from: 101, to: 120, totalPages: 3 })
  })

  it('handles an exact multiple and a single page', () => {
    expect(pageRange(2, 50, 100)).toEqual({ from: 51, to: 100, totalPages: 2 })
    expect(pageRange(1, 50, 7)).toEqual({ from: 1, to: 7, totalPages: 1 })
  })

  it('returns 0-0 with one page when there are no results or the page is past the end', () => {
    expect(pageRange(1, 50, 0)).toEqual({ from: 0, to: 0, totalPages: 1 })
    expect(pageRange(99, 50, 120)).toEqual({ from: 0, to: 0, totalPages: 3 })
  })
})
