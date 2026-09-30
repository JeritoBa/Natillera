import type { LogAction, LogEntityType } from '@/features/audit/api/logsApi'

export const entityLabel: Record<LogEntityType, string> = {
  MonthlyPayment: 'Cuota mensual', Activity: 'Actividad', ActivitySale: 'Venta de actividad', Loan: 'Préstamo',
  LoanPayment: 'Pago de préstamo', Performance: 'Rendimiento', Transaction: 'Transacción',
}
export const entityColor: Record<LogEntityType, string> = {
  MonthlyPayment: '#0a6635', Activity: '#9a6e00', ActivitySale: '#0074b3', Loan: '#c0392b',
  LoanPayment: '#0a6635', Performance: '#0074b3', Transaction: '#4e7460',
}
export const entityBackground: Record<LogEntityType, string> = {
  MonthlyPayment: '#dcf5e8', Activity: '#fef6dc', ActivitySale: '#ddf0ff', Loan: '#fde8e4',
  LoanPayment: '#dcf5e8', Performance: '#ddf0ff', Transaction: '#eef4f0',
}
export const actionLabel: Record<LogAction, string> = { Create: 'Crear', Update: 'Actualizar', Delete: 'Eliminar' }
export const actionColor: Record<LogAction, string> = { Create: '#0a6635', Update: '#0074b3', Delete: '#c0392b' }
export const actionBackground: Record<LogAction, string> = { Create: '#dcf5e8', Update: '#ddf0ff', Delete: '#fde8e4' }
export const entityTypes = Object.keys(entityLabel) as LogEntityType[]
export const actions = Object.keys(actionLabel) as LogAction[]
