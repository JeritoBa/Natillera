import { describe, expect, it } from 'vitest'
import { buildDemoFixtures } from '@/features/demo/model/demoFixtures'
import { DEMO_PAGE_SIZE, pageDemoLogs, pageDemoTransactions } from '@/features/demo/model/demoPaging'
import type { LogListItem } from '@/features/audit/api/logsApi'
import type { RealTransaction } from '@/features/transactions/api/transactionsApi'

const f = buildDemoFixtures(new Date())

const manyTransactions = (count: number): RealTransaction[] => Array.from({ length: count }, (_, index) => ({
  id: `t${index}`, amount: 1000, direction: index % 2 === 0 ? 'Income' : 'Expense', type: index % 3 === 0 ? 'Loan' : 'MonthlyPayment',
  occurredAt: new Date(Date.UTC(2026, 2, 28) - index * 3_600_000).toISOString(), description: `Tx ${index}`, memberName: null, isCancelled: index === 1,
}))

// TX-03 / DEMO-02
describe('pageDemoTransactions', () => {
  it('returns the first 50 with the real contract and the totals of the whole filtered set', () => {
    const page = pageDemoTransactions(manyTransactions(120), new URLSearchParams())
    expect(page.items).toHaveLength(DEMO_PAGE_SIZE)
    expect(page).toMatchObject({ total: 119, page: 1, pageSize: 50 }) // UI-16: the cancelled one is hidden
    expect(page.items.map(item => item.id)).not.toContain('t1')
    expect(page.statusCounts).toEqual({ active: 119, cancelled: 1 })
    expect(page.items[0].id).toBe('t0')
    expect(page.summary.income + page.summary.expense).toBe(119000) // 120 movements minus the cancelled one
    expect(page.months.length).toBeGreaterThan(0)
  })

  it('pages with ?page and keeps the total; a page past the end is empty', () => {
    const all = manyTransactions(120)
    expect(pageDemoTransactions(all, new URLSearchParams('page=3')).items.map(item => item.id)[0]).toBe('t101')
    const past = pageDemoTransactions(all, new URLSearchParams('page=99'))
    expect(past.items).toEqual([])
    expect(past.total).toBe(119)
  })

  it('filters by type and month before paging', () => {
    const all = manyTransactions(120)
    const loans = pageDemoTransactions(all, new URLSearchParams('type=Loan'))
    expect(loans.total).toBe(40) // index 0, 3, 6... (none of them is the cancelled index 1)
    expect(loans.items.every(item => item.type === 'Loan')).toBe(true)
    expect(pageDemoTransactions(all, new URLSearchParams('month=2020-01')).total).toBe(0)
  })

  it('serves the demo fixtures', () => {
    const live = f.transactions.filter(transaction => !transaction.isCancelled).length
    expect(pageDemoTransactions(f.transactions, new URLSearchParams()).total).toBe(live)
  })

  // UI-16
  it('status=cancelled lists only the cancelled ones; the totals and the status counts follow type and month', () => {
    const all = manyTransactions(120)
    const cancelled = pageDemoTransactions(all, new URLSearchParams('status=cancelled'))
    expect(cancelled.items.map(item => item.id)).toEqual(['t1'])
    expect(cancelled.total).toBe(1)
    expect(cancelled.summary).toEqual({ income: 0, expense: 0 })
    expect(cancelled.statusCounts).toEqual({ active: 119, cancelled: 1 })
    expect(pageDemoTransactions(all, new URLSearchParams('type=Loan&status=cancelled')).statusCounts).toEqual({ active: 40, cancelled: 0 })
  })

  it('month options count the records of the chosen status view', () => {
    const all = manyTransactions(120)
    expect(pageDemoTransactions(all, new URLSearchParams()).months.reduce((total, option) => total + option.count, 0)).toBe(119)
    expect(pageDemoTransactions(all, new URLSearchParams('status=cancelled')).months.reduce((total, option) => total + option.count, 0)).toBe(1)
  })
})

// AUD-04 / DEMO-02
describe('pageDemoLogs', () => {
  const logs: LogListItem[] = Array.from({ length: 60 }, (_, index) => ({
    id: `l${index}`, entityType: index % 2 === 0 ? 'Loan' : 'Activity', entityId: `e${index}`, action: 'Create', occurredAt: '2026-03-10T15:00:00Z',
    oldValue: null, newValue: 1000 + index, userId: 'u', userName: 'Ana Gómez',
  }))

  it('returns the first 50 of 60 and the second page with the rest', () => {
    expect(pageDemoLogs(logs, new URLSearchParams())).toMatchObject({ total: 60, page: 1, pageSize: 50 })
    expect(pageDemoLogs(logs, new URLSearchParams()).items).toHaveLength(50)
    expect(pageDemoLogs(logs, new URLSearchParams('page=2')).items).toHaveLength(10)
  })

  it('applies entity and text filters and counts the filtered total', () => {
    expect(pageDemoLogs(logs, new URLSearchParams('entity=Loan')).total).toBe(30)
    expect(pageDemoLogs(logs, new URLSearchParams('q=1005')).items.map(item => item.id)).toEqual(['l5'])
  })
})
