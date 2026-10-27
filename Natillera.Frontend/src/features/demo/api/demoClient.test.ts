import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveDemoRequest } from '@/features/demo/api/demoClient'
import { buildDemoFixtures } from '@/features/demo/model/demoFixtures'
import { DEMO_ROLE_KEY, DEMO_WRITE_EVENT } from '@/features/demo/model/demoSession'
import { apiRequest } from '@/shared/api/apiClient'
import { ApiError } from '@/shared/api/apiError'
import type { DashboardSummary } from '@/features/dashboard/api/dashboardApi'
import type { LoanDetail } from '@/features/loans/api/loansApi'
import type { MonthlyPaymentResponse } from '@/features/monthlyPayments/api/monthlyPaymentsApi'

const f = buildDemoFixtures(new Date())
const loanId = Object.keys(f.loanDetails)[0]
const loan = f.loanDetails[loanId]
const activity = Object.values(f.activityDetails)[0]
const memberId = f.members[0].id

const readPaths = [
  '/api/dashboard/summary', '/api/members', `/api/members/${memberId}/details`, '/api/monthly-payments', '/api/loans', `/api/loans/${loanId}`,
  `/api/loans/${loanId}/payments/${loan.payments[0].id}`, `/api/loans/${loanId}/interest-payments/${loan.interestPayments[0].id}`,
  '/api/activities', `/api/activities/${activity.id}`, `/api/activities/${activity.id}/assignments/${activity.assignments[0].id}`,
  '/api/transactions', `/api/transactions/${f.transactions[0].id}`, '/api/logs', `/api/logs/${f.logs[0].id}`,
]

async function status(promise: Promise<unknown>) {
  try { await promise; return 200 } catch (error) { return error instanceof ApiError ? error.status : -1 }
}

describe('demo client', () => {
  it('DEMO-02: every read route used by the pages resolves for the Admin', async () => {
    for (const path of readPaths) expect(await status(resolveDemoRequest(path, 'GET', 'Admin')), path).toBe(200)
  })

  it('DEMO-02 / UI-04: the Member resolves every read except Logs and member details (403)', async () => {
    for (const path of readPaths) {
      const forbidden = path.startsWith('/api/logs') || path.endsWith('/details')
      expect(await status(resolveDemoRequest(path, 'GET', 'Member')), path).toBe(forbidden ? 403 : 200)
    }
  })

  it('DEMO-02: query strings are ignored', async () => {
    expect(await status(resolveDemoRequest('/api/loans?x=1', 'GET', 'Admin'))).toBe(200)
  })

  it('TX-03 / AUD-04 / DEMO-02: transactions and logs answer the paginated contract and honor the query', async () => {
    const transactions = await resolveDemoRequest<{ items: unknown[], total: number, page: number, pageSize: number, summary: object, months: unknown[] }>('/api/transactions?page=1', 'GET', 'Admin')
    expect(transactions).toMatchObject({ total: f.transactions.length, page: 1, pageSize: 50 })
    expect(Array.isArray(transactions.months)).toBe(true)
    const none = await resolveDemoRequest<{ items: unknown[], total: number }>('/api/transactions?month=2000-01', 'GET', 'Member')
    expect(none).toMatchObject({ items: [], total: 0 })
    const logs = await resolveDemoRequest<{ items: unknown[], total: number }>('/api/logs?entity=Loan', 'GET', 'Admin')
    expect(logs.total).toBe(f.logs.filter(log => log.entityType === 'Loan').length)
  })

  it('UI-04 / MP-09: the Member gets the Member dashboard and only Paid fees', async () => {
    const summary = await resolveDemoRequest<DashboardSummary>('/api/dashboard/summary', 'GET', 'Member')
    expect(summary.role).toBe('Member')
    expect((await resolveDemoRequest<DashboardSummary>('/api/dashboard/summary', 'GET', 'Admin')).role).toBe('Admin')
    const payments = await resolveDemoRequest<MonthlyPaymentResponse[]>('/api/monthly-payments', 'GET', 'Member')
    expect(payments.length).toBeGreaterThan(0)
    expect(payments.every(payment => payment.status === 'Paid')).toBe(true)
    const adminPayments = await resolveDemoRequest<MonthlyPaymentResponse[]>('/api/monthly-payments', 'GET', 'Admin')
    expect(adminPayments.some(payment => payment.status !== 'Paid')).toBe(true)
  })

  it('DEMO-02: unknown ids and routes answer 404 with a "not found" message', async () => {
    const paths = ['/api/loans/missing', '/api/activities/missing', '/api/transactions/missing', '/api/members/missing/details', '/api/logs/missing', `/api/loans/${loanId}/payments/missing`, '/api/unknown']
    for (const path of paths) {
      const error = await resolveDemoRequest(path, 'GET', 'Admin').then(() => null, (caught: unknown) => caught)
      expect(error, path).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(404)
      expect((error as ApiError).message.toLowerCase()).toContain('not found')
    }
  })

  it('DEMO-02: results are clones, so callers cannot alter the fixtures', async () => {
    const first = await resolveDemoRequest<LoanDetail>(`/api/loans/${loanId}`, 'GET', 'Admin')
    first.initialAmount = 1
    const second = await resolveDemoRequest<LoanDetail>(`/api/loans/${loanId}`, 'GET', 'Admin')
    expect(second.initialAmount).toBe(loan.initialAmount)
  })
})

describe('demo write requests and apiRequest integration', () => {
  let target: EventTarget
  const fetchMock = vi.fn()

  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
    })
    target = new EventTarget()
    vi.stubGlobal('window', Object.assign(target, { setTimeout, clearTimeout }))
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('DEMO-04: POST/PUT/PATCH/DELETE resolve undefined, emit the demo event and change nothing', async () => {
    let events = 0
    target.addEventListener(DEMO_WRITE_EVENT, () => { events += 1 })
    const before = await resolveDemoRequest('/api/loans', 'GET', 'Admin')
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(await resolveDemoRequest('/api/loans', method, 'Admin')).toBeUndefined()
    }
    expect(events).toBe(4)
    expect(await resolveDemoRequest('/api/loans', 'GET', 'Admin')).toEqual(before)
  })

  it('DEMO-02: in demo mode apiRequest never calls fetch', async () => {
    sessionStorage.setItem(DEMO_ROLE_KEY, 'Admin')
    expect(Array.isArray(await apiRequest('/api/loans', { token: 'demo' }))).toBe(true)
    expect(await apiRequest('/api/loans', { method: 'POST', token: 'demo', body: '{}' })).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('DEMO-05: outside demo mode apiRequest still uses fetch', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] })
    await apiRequest('/api/loans', { token: 'real' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
