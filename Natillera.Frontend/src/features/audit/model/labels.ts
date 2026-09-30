import type { LogAction, LogEntityType } from '@/features/audit/api/logsApi'

export const entityLabel: Record<LogEntityType, string> = {
  MonthlyPayment: 'Cuota mensual', Activity: 'Actividad', ActivitySale: 'Venta de actividad', Loan: 'Préstamo',
  LoanPayment: 'Pago de préstamo', Performance: 'Rendimiento', Transaction: 'Transacción',
}
export const actionLabel: Record<LogAction, string> = { Create: 'Crear', Update: 'Actualizar', Delete: 'Eliminar' }
export const actionColor: Record<LogAction, string> = { Create: '#0a6635', Update: '#0074b3', Delete: '#c0392b' }
export const actionBackground: Record<LogAction, string> = { Create: '#dcf5e8', Update: '#ddf0ff', Delete: '#fde8e4' }
export const entityTypes = Object.keys(entityLabel) as LogEntityType[]
export const actions = Object.keys(actionLabel) as LogAction[]
