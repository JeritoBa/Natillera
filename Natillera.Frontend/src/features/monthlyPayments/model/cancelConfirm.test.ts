import { describe, expect, it } from 'vitest'
import { CANNOT_UNDO } from '@/shared/lib/cancelConfirm'
import { feeCancelConsequences } from './cancelConfirm'

// UI-13
describe('fee cancellation consequences', () => {
  it('ends with the irreversible note', () => {
    expect(feeCancelConsequences()).toEqual(['La cuota quedará anulada.', CANNOT_UNDO])
  })
})
