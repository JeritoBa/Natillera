import { describe, expect, it } from 'vitest'
import { formatCurrency } from '@/shared/lib/formatters'
import { CANNOT_UNDO } from '@/shared/lib/cancelConfirm'
import { interestCancelConsequences, loanCancelConsequences, loanPaymentCancelConsequences } from './cancelConfirm'

// UI-13
describe('loan cancellation consequences', () => {
  it('formats the amount that returns to the outstanding principal', () => {
    const texts = loanPaymentCancelConsequences(150000)
    expect(texts[1]).toBe(`El capital pendiente aumentará en ${formatCurrency(150000)}.`)
    expect(texts.at(-1)).toBe(CANNOT_UNDO)
  })

  it('differs between a Paid and a Pending interest', () => {
    const paid = interestCancelConsequences('Paid')
    const pending = interestCancelConsequences('Pending')
    expect(paid).toHaveLength(3)
    expect(paid[1]).toContain('rendimientos')
    expect(pending).toHaveLength(2)
    expect(pending[0]).toContain('pendiente por cobrar')
    expect(paid.at(-1)).toBe(CANNOT_UNDO)
    expect(pending.at(-1)).toBe(CANNOT_UNDO)
  })

  it('ends the loan consequences with the irreversible note', () => {
    expect(loanCancelConsequences()).toEqual(['El préstamo y su desembolso quedarán anulados.', CANNOT_UNDO])
  })
})
