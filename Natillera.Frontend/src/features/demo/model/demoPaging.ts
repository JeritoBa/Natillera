// DEMO-02: the demo serves the paginated transactions and logs endpoints (TX-03, AUD-04) from its fixtures with the real contract.
// It reuses the same filter helpers as the pages so the demo shows what the API would return.
import type { LogListItem, LogPage } from '@/features/audit/api/logsApi'
import { filterLogs, parseLogActionFilter, parseLogDateFilter, parseLogEntityFilter } from '@/features/audit/model/logFilters'
import type { RealTransaction, TransactionPage } from '@/features/transactions/api/transactionsApi'
import { filterTransactions, parseTransactionMonthFilter, parseTransactionTypeFilter, transactionMonthOptions } from '@/features/transactions/model/transactionFilters'
import { transactionTotals } from '@/features/transactions/model/transactionTotals'
import { parsePageParam } from '@/shared/lib/pagination'

export const DEMO_PAGE_SIZE = 50

const slice = <T>(items: T[], page: number) => items.slice((page - 1) * DEMO_PAGE_SIZE, page * DEMO_PAGE_SIZE)

export function pageDemoTransactions(transactions: RealTransaction[], params: URLSearchParams): TransactionPage {
  const page = parsePageParam(params.get('page'))
  const filtered = filterTransactions(transactions, parseTransactionTypeFilter(params.get('type')), parseTransactionMonthFilter(params.get('month')))
  return {
    items: slice(filtered, page),
    total: filtered.length,
    page,
    pageSize: DEMO_PAGE_SIZE,
    summary: transactionTotals(filtered),
    months: transactionMonthOptions(transactions).map(option => ({ month: option.key, count: option.count })),
  }
}

export function pageDemoLogs(logs: LogListItem[], params: URLSearchParams): LogPage {
  const page = parsePageParam(params.get('page'))
  const filtered = filterLogs(logs, {
    q: params.get('q') ?? '',
    entity: parseLogEntityFilter(params.get('entity')),
    action: parseLogActionFilter(params.get('action')),
    from: parseLogDateFilter(params.get('from')),
    to: parseLogDateFilter(params.get('to')),
  })
  return { items: slice(filtered, page), total: filtered.length, page, pageSize: DEMO_PAGE_SIZE }
}
