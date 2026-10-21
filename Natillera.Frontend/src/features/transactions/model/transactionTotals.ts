import type { TransactionDirection } from '@/features/transactions/api/transactionsApi'

interface TotalizableTransaction { amount: number, direction: TransactionDirection, isCancelled: boolean }

// FIN-06: cancelled transactions are excluded from every total.
export function transactionTotals(transactions: TotalizableTransaction[]): { income: number, expense: number } {
  const sum = (direction: TransactionDirection) => transactions
    .filter(transaction => !transaction.isCancelled && transaction.direction === direction)
    .reduce((total, transaction) => total + transaction.amount, 0)
  return { income: sum('Income'), expense: sum('Expense') }
}
