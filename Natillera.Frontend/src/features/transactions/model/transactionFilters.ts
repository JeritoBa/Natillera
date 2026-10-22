import type { TransactionType } from '@/features/transactions/api/transactionsApi'

// UI-06: the month is the Colombia (America/Bogota) date of occurredAt (the API sends a UTC timestamp), regardless of the browser time zone.
const bogotaMonth = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit' })
export const transactionMonthKey = (occurredAt: string) => {
  const parts = bogotaMonth.formatToParts(new Date(occurredAt))
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}`
}

interface FilterableTransaction { type: TransactionType, occurredAt: string }

export function filterTransactions<T extends FilterableTransaction>(transactions: T[], type: 'all' | TransactionType, month: 'all' | string): T[] {
  return transactions.filter(transaction =>
    (type === 'all' || transaction.type === type)
    && (month === 'all' || transactionMonthKey(transaction.occurredAt) === month))
}

// Months found in the transactions, newest first, with their number of movements.
export function transactionMonthOptions(transactions: FilterableTransaction[]): { key: string, count: number }[] {
  const counts = new Map<string, number>()
  for (const transaction of transactions) {
    const key = transactionMonthKey(transaction.occurredAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.key.localeCompare(a.key))
}
