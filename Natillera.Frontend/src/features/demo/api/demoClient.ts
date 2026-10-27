// DEMO-02 / DEMO-04: answers API requests from bundled fixtures while demo mode is active.
// Reads only select from the fixtures (and filter by role, MP-09); writes save nothing.
import { ApiError } from '@/shared/api/apiError'
import { buildDemoFixtures, type DemoFixtures } from '@/features/demo/model/demoFixtures'
import { pageDemoLogs, pageDemoTransactions } from '@/features/demo/model/demoPaging'
import { DEMO_WRITE_EVENT, type DemoRole } from '@/features/demo/model/demoSession'

let cachedFixtures: DemoFixtures | null = null
const fixtures = () => (cachedFixtures ??= buildDemoFixtures(new Date()))

const ID = '([^/]+)'
const pick = <T>(record: Record<string, T>, id: string, entity: string): T => {
  const item = Object.prototype.hasOwnProperty.call(record, id) ? record[id] : undefined
  if (item === undefined) throw new ApiError(404, `${entity} not found.`)
  return item
}

interface Route {
  pattern: RegExp
  adminOnly?: boolean
  resolve: (f: DemoFixtures, role: DemoRole, match: RegExpMatchArray, params: URLSearchParams) => unknown
}

const routes: Route[] = [
  { pattern: /^\/api\/dashboard\/summary$/, resolve: (f, role) => (role === 'Admin' ? f.adminSummary : f.memberSummary) },
  { pattern: /^\/api\/members$/, resolve: f => f.members },
  { pattern: new RegExp(`^/api/members/${ID}/details$`), adminOnly: true, resolve: (f, _role, match) => pick(f.memberDetails, match[1], 'Member') },
  { pattern: /^\/api\/monthly-payments$/, resolve: (f, role) => (role === 'Admin' ? f.monthlyPayments : f.memberMonthlyPayments) },
  { pattern: /^\/api\/loans$/, resolve: f => f.loans },
  { pattern: new RegExp(`^/api/loans/${ID}$`), resolve: (f, _role, match) => pick(f.loanDetails, match[1], 'Loan') },
  {
    pattern: new RegExp(`^/api/loans/${ID}/payments/${ID}$`),
    resolve: (f, _role, match) => {
      const payment = pick(f.loanDetails, match[1], 'Loan').payments.find(item => item.id === match[2])
      if (!payment) throw new ApiError(404, 'Loan payment not found.')
      return payment
    },
  },
  {
    pattern: new RegExp(`^/api/loans/${ID}/interest-payments/${ID}$`),
    resolve: (f, _role, match) => {
      const interest = pick(f.loanDetails, match[1], 'Loan').interestPayments.find(item => item.id === match[2])
      if (!interest) throw new ApiError(404, 'Interest payment not found.')
      return interest
    },
  },
  { pattern: /^\/api\/activities$/, resolve: f => f.activities },
  { pattern: new RegExp(`^/api/activities/${ID}$`), resolve: (f, _role, match) => pick(f.activityDetails, match[1], 'Activity') },
  {
    pattern: new RegExp(`^/api/activities/${ID}/assignments/${ID}$`),
    resolve: (f, _role, match) => {
      const assignment = pick(f.activityDetails, match[1], 'Activity').assignments.find(item => item.id === match[2])
      if (!assignment) throw new ApiError(404, 'Assignment not found.')
      return assignment
    },
  },
  { pattern: /^\/api\/transactions$/, resolve: (f, _role, _match, params) => pageDemoTransactions(f.transactions, params) },
  { pattern: new RegExp(`^/api/transactions/${ID}$`), resolve: (f, _role, match) => pick(f.transactionDetails, match[1], 'Transaction') },
  { pattern: /^\/api\/logs$/, adminOnly: true, resolve: (f, _role, _match, params) => pageDemoLogs(f.logs, params) },
  { pattern: new RegExp(`^/api/logs/${ID}$`), adminOnly: true, resolve: (f, _role, match) => pick(f.logDetails, match[1], 'Log') },
]

export async function resolveDemoRequest<T>(path: string, method: string, role: DemoRole): Promise<T> {
  if (method.toUpperCase() !== 'GET') {
    // DEMO-04: nothing is saved; the UI closes its form and the toast explains why.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(DEMO_WRITE_EVENT))
    return undefined as T
  }

  const [route, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  for (const candidate of routes) {
    const match = route.match(candidate.pattern)
    if (!match) continue
    if (candidate.adminOnly && role !== 'Admin') throw new ApiError(403, '')
    return structuredClone(candidate.resolve(fixtures(), role, match, params)) as T
  }
  throw new ApiError(404, 'Resource not found.')
}
