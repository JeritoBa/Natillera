import type { TransactionType } from '@/features/transactions/api/transactionsApi'

export const typeLabel: Record<TransactionType, string> = {
  MonthlyPayment: 'Cuota mensual', Activity: 'Actividad', ActivitySale: 'Venta', Loan: 'Préstamo', LoanPayment: 'Pago préstamo', Performance: 'Rendimiento',
}
export const typeColor: Record<TransactionType, string> = {
  MonthlyPayment: '#0a6635', Activity: '#9a6e00', ActivitySale: '#0074b3', Loan: '#c0392b', LoanPayment: '#0a6635', Performance: '#0074b3',
}
export const typeBackground: Record<TransactionType, string> = {
  MonthlyPayment: '#dcf5e8', Activity: '#fef6dc', ActivitySale: '#ddf0ff', Loan: '#fde8e4', LoanPayment: '#dcf5e8', Performance: '#ddf0ff',
}
