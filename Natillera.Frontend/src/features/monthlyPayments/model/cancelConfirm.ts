import { CANNOT_UNDO } from '@/shared/lib/cancelConfirm'

// UI-13: consequences shown in the cancellation dialog; the irreversible note is always last.
export const feeCancelConsequences = () => ['La cuota quedará anulada.', CANNOT_UNDO]
