import type { PaymentMethod } from '@/features/loans/api/loansApi'

export const methodLabel: Record<PaymentMethod, string> = { Cash: 'Efectivo', Transfer: 'Transferencia' }

// Dates without time (e.g. loan start date) are shown as-is, without timezone shifts.
export const formatDateOnly = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO')
export const toDateInput = (value: string) => value.slice(0, 10)
export const longDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
