import { CANNOT_UNDO } from '@/shared/lib/cancelConfirm'

// UI-13: consequences shown in the cancellation dialog; the irreversible note is always last.
export const activityCancelConsequences = () => ['La actividad y su egreso quedarán anulados.', CANNOT_UNDO]

export const extraCostCancelConsequences = (status: string) => status === 'Paid'
  ? ['El costo y su egreso quedarán anulados y se devolverá a los intereses que se reparten.', CANNOT_UNDO]
  : ['El costo extra quedará anulado.', CANNOT_UNDO]

export const assignmentCancelConsequences = (status: string) => status === 'Paid'
  ? ['La asignación y su ingreso quedarán anulados.', CANNOT_UNDO]
  : ['La asignación quedará anulada.', CANNOT_UNDO]
