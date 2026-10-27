import { describe, expect, it } from 'vitest'
import { CANNOT_UNDO } from '@/shared/lib/cancelConfirm'
import { activityCancelConsequences, assignmentCancelConsequences, extraCostCancelConsequences } from './cancelConfirm'

// UI-13
describe('activity cancellation consequences', () => {
  it('ends the activity consequences with the irreversible note', () => {
    expect(activityCancelConsequences()).toEqual(['La actividad y su egreso quedarán anulados.', CANNOT_UNDO])
  })

  it('differs between a Paid and a Pending extra cost', () => {
    expect(extraCostCancelConsequences('Paid')[0]).toContain('se devolverá a los intereses que se reparten')
    expect(extraCostCancelConsequences('Pending')).toEqual(['El costo extra quedará anulado.', CANNOT_UNDO])
  })

  it('differs between a Paid and a Pending assignment', () => {
    expect(assignmentCancelConsequences('Paid')).toEqual(['La asignación y su ingreso quedarán anulados.', CANNOT_UNDO])
    expect(assignmentCancelConsequences('Pending')).toEqual(['La asignación quedará anulada.', CANNOT_UNDO])
  })
})
