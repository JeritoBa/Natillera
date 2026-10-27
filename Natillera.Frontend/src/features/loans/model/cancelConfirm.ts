import { formatCurrency } from '@/shared/lib/formatters'
import { CANNOT_UNDO } from '@/shared/lib/cancelConfirm'

// UI-13: consequences shown in the cancellation dialog; the irreversible note is always last.
export const loanPaymentCancelConsequences = (amount: number) => [
  'El abono y su ingreso en la caja quedarán anulados.',
  `El capital pendiente aumentará en ${formatCurrency(amount)}.`,
  CANNOT_UNDO,
]

export const interestCancelConsequences = (status: string) => status === 'Paid'
  ? ['El interés y su ingreso en la caja quedarán anulados.', 'Bajarán los rendimientos que se reparten entre los socios.', CANNOT_UNDO]
  : ['El interés quedará anulado y dejará de contarse como pendiente por cobrar.', CANNOT_UNDO]

export const loanCancelConsequences = () => ['El préstamo y su desembolso quedarán anulados.', CANNOT_UNDO]
