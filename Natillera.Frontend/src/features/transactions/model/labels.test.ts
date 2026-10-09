import { describe, expect, it } from 'vitest'
import { typeBackground, typeColor, typeLabel } from '@/features/transactions/model/labels'

describe('transaction labels', () => {
  it('label, color and background maps cover the same transaction types', () => {
    const keys = Object.keys(typeLabel).sort()
    expect(keys).toEqual(['Activity', 'ActivitySale', 'Loan', 'LoanPayment', 'MonthlyPayment', 'Performance'])
    expect(Object.keys(typeColor).sort()).toEqual(keys)
    expect(Object.keys(typeBackground).sort()).toEqual(keys)
  })
})
