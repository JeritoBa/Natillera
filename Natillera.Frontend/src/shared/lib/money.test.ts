import { describe, expect, it } from 'vitest'
import { digitsOnly, formatMoneyInput, formatThousands, parsePastedMoney, toMoneyInputValue } from '@/shared/lib/money'

// UI-08
describe('formatThousands', () => {
  it.each([['0', '0'], ['999', '999'], ['1000', '1.000'], ['1234567', '1.234.567']])('formats %s', (input, expected) => {
    expect(formatThousands(input)).toBe(expected)
  })
})

describe('digitsOnly', () => {
  it('strips non-digits', () => expect(digitsOnly('$ 50.000')).toBe('50000'))
  it('strips leading zeros but keeps a single zero', () => {
    expect(digitsOnly('00050')).toBe('50')
    expect(digitsOnly('000')).toBe('0')
  })
  it('returns empty for no digits', () => expect(digitsOnly('abc')).toBe(''))
  it('caps at 12 digits', () => expect(digitsOnly('1234567890123456')).toBe('123456789012'))
})

describe('formatMoneyInput', () => {
  it('formats and puts the caret at the end when typing at the end', () => {
    expect(formatMoneyInput('50000', 5)).toEqual({ raw: '50000', display: '50.000', caret: 6 })
  })
  it('keeps the caret after the same digit when inserting in the middle', () => {
    // "50.000" with "7" typed after the first digit -> "570.000", caret after "57"
    expect(formatMoneyInput('570.000', 2)).toEqual({ raw: '570000', display: '570.000', caret: 2 })
    // misplaced separator: the caret still follows the digit count
    expect(formatMoneyInput('57.0000', 3)).toEqual({ raw: '570000', display: '570.000', caret: 2 })
  })
  it('keeps the caret in place when deleting a middle digit', () => {
    // "1.234.567" delete "3" -> "1.24.567" caret 4
    expect(formatMoneyInput('1.24.567', 4)).toEqual({ raw: '124567', display: '124.567', caret: 3 })
  })
  it('ignores an invalid character without moving the caret over digits', () => {
    expect(formatMoneyInput('5a0.000', 2)).toEqual({ raw: '50000', display: '50.000', caret: 1 })
  })
  it('drops leading zeros', () => {
    expect(formatMoneyInput('05', 2)).toEqual({ raw: '5', display: '5', caret: 1 })
  })
  it('caps at 12 digits', () => {
    expect(formatMoneyInput('1234567890123', 13).raw).toBe('123456789012')
  })
  it('returns empty for empty text', () => {
    expect(formatMoneyInput('', 0)).toEqual({ raw: '', display: '', caret: 0 })
  })
})

describe('parsePastedMoney', () => {
  it.each([
    ['$ 50.000', '50000'],
    ['50000', '50000'],
    ['50,000', '50000'],
    ['$ 1.250.000', '1250000'],
    ['50.000,00', '50000'],
    ['COP 50.000', '50000'],
    [' 50.000 ', '50000'],
  ])('accepts %j', (input, expected) => {
    expect(parsePastedMoney(input)).toBe(expected)
  })
  it.each(['50.000,50', 'abc', '', '12.5', '1.2.3'])('rejects %j', input => {
    expect(parsePastedMoney(input)).toBeNull()
  })
})

describe('toMoneyInputValue', () => {
  it('converts amounts to digit strings', () => expect(toMoneyInputValue(50000)).toBe('50000'))
  it('rounds instead of concatenating decimals', () => expect(toMoneyInputValue(50000.4)).toBe('50000'))
  it('returns empty for non-finite numbers', () => expect(toMoneyInputValue(Number.NaN)).toBe(''))
})
