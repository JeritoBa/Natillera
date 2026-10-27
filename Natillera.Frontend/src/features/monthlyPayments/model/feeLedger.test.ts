import { describe, expect, it } from 'vitest'
import { formatDateOnly } from '@/features/loans/model/labels'
import { formatCurrency } from '@/shared/lib/formatters'
import {
  buildFeeLedger, feeLedgerEmptyText, feeLedgerLinkPath, feeLedgerSummary, feeMonthSrText, hasLiveFees, memberLedgerFees, startedMonths, yearMonthOf,
  type LedgerFee,
} from './feeLedger'

const fee = (month: number, status: LedgerFee['status'], overrides: Partial<LedgerFee> = {}): LedgerFee => ({
  userId: 'u-1', year: 2026, month, amount: 50000, status, paidAt: status === 'Paid' ? `2026-${String(month).padStart(2, '0')}-05T10:00:00Z` : null, ...overrides,
})
const october = { year: 2026, month: 10 }
const states = (fees: LedgerFee[], year = 2026, today = october) => buildFeeLedger(fees, 'u-1', year, today).map(month => month.state)

// MEM-11
describe('buildFeeLedger', () => {
  const fees = [fee(1, 'Paid'), fee(2, 'Paid'), fee(3, 'Paid'), fee(4, 'Cancelled'), fee(10, 'Pending')]

  it('marks paid, pending, no fee and upcoming months (spec 022 criterion 1)', () => {
    expect(states(fees)).toEqual(['paid', 'paid', 'paid', 'none', 'none', 'none', 'none', 'none', 'none', 'pending', 'upcoming', 'upcoming'])
    expect(feeLedgerSummary(buildFeeLedger(fees, 'u-1', 2026, october), 2026, october)).toBe('3 de 12 meses pagados · 1 pendiente · 6 sin cuota')
  })

  it('lets Paid win over Pending and ignores cancelled fees', () => {
    expect(states([fee(5, 'Pending'), fee(5, 'Paid')])[4]).toBe('paid')
    expect(states([fee(5, 'Cancelled')])[4]).toBe('none')
  })

  it('ignores other members and other years', () => {
    expect(states([fee(1, 'Paid', { userId: 'u-2' }), fee(2, 'Paid', { year: 2025 })]).slice(0, 2)).toEqual(['none', 'none'])
  })

  it('keeps the amount and the paid date of a paid month', () => {
    const march = buildFeeLedger(fees, 'u-1', 2026, october)[2]
    expect(march).toMatchObject({ key: '2026-03', amount: 50000, paidAt: fees[2].paidAt, isCurrent: false })
  })

  it('flags only the current month of the current period', () => {
    expect(buildFeeLedger([], 'u-1', 2026, october).filter(month => month.isCurrent).map(month => month.month)).toEqual([10])
    expect(buildFeeLedger([], 'u-1', 2025, october).some(month => month.isCurrent)).toBe(false)
  })

  it('has no upcoming months in a past period and only upcoming months in a future one', () => {
    expect(states([], 2025)).toEqual(Array(12).fill('none'))
    expect(states([], 2027)).toEqual(Array(12).fill('upcoming'))
  })
})

describe('startedMonths', () => {
  it('counts the months that already started', () => {
    expect(startedMonths(2025, october)).toBe(12)
    expect(startedMonths(2026, october)).toBe(10)
    expect(startedMonths(2027, october)).toBe(0)
  })

  it('reads the year and month of a date', () => {
    expect(yearMonthOf(new Date(2026, 9, 26))).toEqual({ year: 2026, month: 10 })
  })
})

describe('feeLedgerSummary', () => {
  it('omits the zero parts except the paid one and handles plurals', () => {
    const none = buildFeeLedger([], 'u-1', 2025, october)
    expect(feeLedgerSummary(none, 2025, october)).toBe('0 de 12 meses pagados · 12 sin cuota')
    const two = buildFeeLedger([fee(1, 'Pending'), fee(2, 'Pending')], 'u-1', 2026, { year: 2026, month: 2 })
    expect(feeLedgerSummary(two, 2026, { year: 2026, month: 2 })).toBe('0 de 12 meses pagados · 2 pendientes')
    const all = buildFeeLedger(Array.from({ length: 12 }, (_, index) => fee(index + 1, 'Paid')), 'u-1', 2026, { year: 2026, month: 12 })
    expect(feeLedgerSummary(all, 2026, { year: 2026, month: 12 })).toBe('12 de 12 meses pagados')
  })

  it('says the period has not started for a future period', () => {
    expect(feeLedgerSummary(buildFeeLedger([], 'u-1', 2027, october), 2027, october)).toBe('El periodo 2027 aún no empieza')
  })
})

describe('feeLedger helpers', () => {
  it('detects whether the period has live fees', () => {
    expect(hasLiveFees(buildFeeLedger([], 'u-1', 2026, october))).toBe(false)
    expect(hasLiveFees(buildFeeLedger([fee(1, 'Pending')], 'u-1', 2026, october))).toBe(true)
  })

  it('words the empty line per audience', () => {
    expect(feeLedgerEmptyText('admin', 2026)).toBe('Aún no tiene cuotas registradas en 2026.')
    expect(feeLedgerEmptyText('member', 2026)).toBe('Aún no tienes cuotas registradas en 2026.')
  })

  it('links paid and pending months for the Admin, only paid ones for the Member (MP-09)', () => {
    const months = buildFeeLedger([fee(3, 'Paid'), fee(10, 'Pending')], 'u-1', 2026, october)
    expect(feeLedgerLinkPath(months[2], 'u-1', 'admin')).toBe('/payments?member=u-1&month=2026-03')
    expect(feeLedgerLinkPath(months[9], 'u-1', 'admin')).toBe('/payments?member=u-1&month=2026-10')
    expect(feeLedgerLinkPath(months[2], 'u-1', 'member')).toBe('/payments?member=u-1&month=2026-03')
    expect(feeLedgerLinkPath(months[9], 'u-1', 'member')).toBeNull()
    expect(feeLedgerLinkPath(months[0], 'u-1', 'admin')).toBeNull()
    expect(feeLedgerLinkPath(months[11], 'u-1', 'admin')).toBeNull()
  })

  it('words each month for screen readers', () => {
    const months = buildFeeLedger([fee(3, 'Paid'), fee(10, 'Pending')], 'u-1', 2026, october)
    expect(feeMonthSrText(months[2], 2026)).toBe(`Marzo 2026: pagada, ${formatCurrency(50000)}, el ${formatDateOnly('2026-03-05T10:00:00Z')}`)
    expect(feeMonthSrText(months[9], 2026)).toBe(`Octubre 2026: pendiente, ${formatCurrency(50000)}`)
    expect(feeMonthSrText(months[0], 2026)).toBe('Enero 2026: sin cuota registrada')
    expect(feeMonthSrText(months[11], 2026)).toBe('Diciembre 2026: por venir')
  })
})

describe('memberLedgerFees', () => {
  it('merges the own paid fees with the pending obligations and drops other members and years', () => {
    const paid = [fee(1, 'Paid'), fee(2, 'Paid', { userId: 'u-2' }), fee(3, 'Paid', { year: 2025 })]
    const merged = memberLedgerFees(paid, [{ year: 2026, month: 10, amount: 60000 }, { year: 2025, month: 11, amount: 1 }], 'u-1', 2026)
    expect(merged.map(item => [item.userId, item.month, item.status])).toEqual([['u-1', 1, 'Paid'], ['u-1', 10, 'Pending']])
    expect(states(merged)).toEqual(['paid', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'pending', 'upcoming', 'upcoming'])
  })
})
