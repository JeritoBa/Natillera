// DEMO-03 / DEMO-06: fictitious, static fixtures that mirror the shapes the real API returns.
// Every money figure (balances, summaries, shares) is a literal: nothing is computed at runtime.
// Only dates (relative to the month in which the demo is opened) and orderings are derived.
// Type-only imports keep this module free of runtime cycles with apiClient.
import type { AuthUser } from '@/features/auth/model/authTypes'
import type { ActivityAssignmentResponse, ActivityDetail, ActivityListItem } from '@/features/activities/api/activitiesApi'
import type { DashboardSummary, DashboardTransaction, MemberPendingObligations, TopSeller } from '@/features/dashboard/api/dashboardApi'
import type { InterestPaymentResponse, LoanDetail, LoanListItem, LoanPaymentResponse } from '@/features/loans/api/loansApi'
import type { LogDetail, LogEntitySummary, LogListItem } from '@/features/audit/api/logsApi'
import type { MemberDetail, MemberPendingPayment, PendingObligations } from '@/features/members/api/membersApi'
import type { Member } from '@/features/members/model/memberTypes'
import type { MonthlyPaymentResponse, MonthlyPaymentStatus } from '@/features/monthlyPayments/api/monthlyPaymentsApi'
import type { RealTransaction, TransactionDetail, TransactionSourceDetail } from '@/features/transactions/api/transactionsApi'

export type DemoTransaction = RealTransaction
export type DemoTransactionDetail = TransactionDetail

export interface DemoFixtures {
  adminUser: AuthUser
  memberUser: AuthUser
  demoMemberId: string
  members: Member[]
  memberDetails: Record<string, MemberDetail>
  monthlyPayments: MonthlyPaymentResponse[]
  memberMonthlyPayments: MonthlyPaymentResponse[]
  loans: LoanListItem[]
  loanDetails: Record<string, LoanDetail>
  activities: ActivityListItem[]
  activityDetails: Record<string, ActivityDetail>
  transactions: DemoTransaction[]
  transactionDetails: Record<string, DemoTransactionDetail>
  logs: LogListItem[]
  logDetails: Record<string, LogDetail>
  adminSummary: DashboardSummary
  memberSummary: DashboardSummary
}

const guid = (n: number) => `d0000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const ADMIN_ID = guid(1)

type MemberKey = 'laura' | 'andres' | 'carlos' | 'sofia' | 'diana' | 'julian'

interface MemberSeed {
  key: MemberKey
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  isActive: boolean
  // Literal figures from the real rules (DASH-04..09); the DEMO-06 test recomputes them.
  balance: { savings: number; activityEarnings: number; performanceEarnings: number; total: number }
  // Literal pending amounts per kind (MEM-10); the DEMO-06 test recomputes them from the entities.
  pending: { total: number; monthlyPayments: number; loans: number; interests: number; activitySales: number }
}

// Same order as GET /api/members: last name, then first name.
const memberSeeds: MemberSeed[] = [
  { key: 'laura', id: guid(11), firstName: 'Laura', lastName: 'Gómez', email: 'laura.gomez@example.com', phone: '3001110011', isActive: true, balance: { savings: 150000, activityEarnings: 40000, performanceEarnings: 2000, total: 192000 }, pending: { total: 50000, monthlyPayments: 50000, loans: 0, interests: 0, activitySales: 0 } },
  { key: 'andres', id: guid(12), firstName: 'Andrés', lastName: 'Mejía', email: 'andres.mejia@example.com', phone: '3001110012', isActive: true, balance: { savings: 150000, activityEarnings: 0, performanceEarnings: 2000, total: 152000 }, pending: { total: 50000, monthlyPayments: 50000, loans: 0, interests: 0, activitySales: 0 } },
  { key: 'carlos', id: guid(13), firstName: 'Carlos', lastName: 'Pérez', email: 'carlos.perez@example.com', phone: '3001110013', isActive: true, balance: { savings: 200000, activityEarnings: 0, performanceEarnings: 2000, total: 202000 }, pending: { total: 204000, monthlyPayments: 0, loans: 200000, interests: 4000, activitySales: 0 } },
  { key: 'sofia', id: guid(14), firstName: 'Sofía', lastName: 'Restrepo', email: 'sofia.restrepo@example.com', phone: '3001110014', isActive: true, balance: { savings: 200000, activityEarnings: 32000, performanceEarnings: 2000, total: 234000 }, pending: { total: 80000, monthlyPayments: 0, loans: 0, interests: 0, activitySales: 80000 } },
  { key: 'diana', id: guid(15), firstName: 'Diana', lastName: 'Ríos', email: 'diana.rios@example.com', phone: '3001110015', isActive: true, balance: { savings: 200000, activityEarnings: 48000, performanceEarnings: 2000, total: 250000 }, pending: { total: 0, monthlyPayments: 0, loans: 0, interests: 0, activitySales: 0 } },
  { key: 'julian', id: guid(16), firstName: 'Julián', lastName: 'Torres', email: 'julian.torres@example.com', phone: '3001110016', isActive: false, balance: { savings: 50000, activityEarnings: 0, performanceEarnings: 2000, total: 52000 }, pending: { total: 0, monthlyPayments: 0, loans: 0, interests: 0, activitySales: 0 } },
]

const seedByKey = Object.fromEntries(memberSeeds.map(seed => [seed.key, seed])) as Record<MemberKey, MemberSeed>
const fullName = (key: MemberKey) => `${seedByKey[key].firstName} ${seedByKey[key].lastName}`

const DEMO_MEMBER: MemberKey = 'laura'

const toUser = (seed: MemberSeed): AuthUser => ({
  id: seed.id, firstName: seed.firstName, lastName: seed.lastName, email: seed.email, phone: seed.phone, role: 'Member', isActive: seed.isActive,
})

const adminUser: AuthUser = { id: ADMIN_ID, firstName: 'Admin', lastName: 'Demo', email: 'admin.demo@example.com', phone: '3000000000', role: 'Admin', isActive: true }

export const demoUsers = {
  admin: adminUser,
  member: toUser(seedByKey[DEMO_MEMBER]),
}

interface TxRecord { tx: DemoTransaction; owner: MemberKey | null; source: TransactionSourceDetail }
interface LogRecord {
  seq: number
  entityType: LogListItem['entityType']
  entityId: string
  action: LogListItem['action']
  occurredAt: string
  oldValue: number | null
  newValue: number | null
  summary: LogEntitySummary | null
}

const emptySource = (entity: string, entityId: string): TransactionSourceDetail => ({
  entity, entityId, memberName: null, year: null, month: null, status: null, paidAt: null, activityId: null, activityName: null, activityDescription: null,
  activityQuantity: null, quantityAssigned: null, unitCost: null, unitSalePrice: null, startDate: null, assignedAt: null, initialAmount: null,
  interestRate: null, loanStartDate: null, loanEndDate: null, paymentMethod: null,
})

export function buildDemoFixtures(now: Date): DemoFixtures {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  // Month offset 0 is the month in which the demo is opened; dates are expressed relative to it.
  const at = (offset: number, day: number, hour = 15) => new Date(Date.UTC(y, m + offset, day, hour, 0, 0)).toISOString()
  const dateOnly = (offset: number, day: number) => at(offset, day, 0)
  const yearOf = (offset: number) => new Date(Date.UTC(y, m + offset, 1)).getUTCFullYear()
  const monthOf = (offset: number) => new Date(Date.UTC(y, m + offset, 1)).getUTCMonth() + 1
  const mmyyyy = (offset: number) => `${String(monthOf(offset)).padStart(2, '0')}/${yearOf(offset)}`

  const txRecords: TxRecord[] = []
  const logRecords: LogRecord[] = []
  let txSeq = 0
  let logSeq = 0

  const addTx = (
    owner: MemberKey | null, memberName: string | null, amount: number, direction: DemoTransaction['direction'], type: DemoTransaction['type'],
    occurredAt: string, description: string, source: TransactionSourceDetail, isCancelled = false,
  ) => {
    txSeq += 1
    const id = guid(200 + txSeq)
    txRecords.push({ tx: { id, amount, direction, type, occurredAt, description, memberName, isCancelled }, owner, source })
    return id
  }
  const addLog = (
    entityType: LogListItem['entityType'], entityId: string, action: LogListItem['action'], occurredAt: string,
    oldValue: number | null, newValue: number | null, summary: LogEntitySummary | null = null,
  ) => {
    logSeq += 1
    logRecords.push({ seq: logSeq, entityType, entityId, action, occurredAt, oldValue, newValue, summary })
  }

  // ---- Members -------------------------------------------------------------------------------
  const members: Member[] = memberSeeds.map(seed => ({ ...toUser(seed), role: 'Member' as const }))

  // ---- Monthly payments ----------------------------------------------------------------------
  interface FeeSeed { member: MemberKey; offset: number; amount: number; status: MonthlyPaymentStatus; day: number }
  const activeKeys: MemberKey[] = ['laura', 'andres', 'carlos', 'sofia', 'diana']
  const feeSeeds: FeeSeed[] = [
    // Three months ago: everybody paid.
    ...([...activeKeys, 'julian'] as MemberKey[]).map(member => ({ member, offset: -3, amount: 50000, status: 'Paid' as const, day: 5 })),
    // Two months ago and last month: the five active members paid.
    ...activeKeys.map(member => ({ member, offset: -2, amount: 50000, status: 'Paid' as const, day: 5 })),
    ...activeKeys.map(member => ({ member, offset: -1, amount: 50000, status: 'Paid' as const, day: 5 })),
    // A fee registered by mistake and cancelled (its Transaction is excluded from every balance).
    { member: 'andres', offset: -1, amount: 40000, status: 'Cancelled', day: 3 },
    // Current month: three paid, two pending.
    { member: 'carlos', offset: 0, amount: 50000, status: 'Paid', day: 1 },
    { member: 'diana', offset: 0, amount: 50000, status: 'Paid', day: 1 },
    { member: 'sofia', offset: 0, amount: 50000, status: 'Paid', day: 1 },
    { member: 'laura', offset: 0, amount: 50000, status: 'Pending', day: 1 },
    { member: 'andres', offset: 0, amount: 50000, status: 'Pending', day: 1 },
  ]

  const monthlyPaymentsAll: MonthlyPaymentResponse[] = feeSeeds.map((seed, index) => {
    const id = guid(100 + index)
    const name = fullName(seed.member)
    const year = yearOf(seed.offset)
    const month = monthOf(seed.offset)
    const isPending = seed.status === 'Pending'
    const paidAt = isPending ? null : at(seed.offset, seed.day)
    let transactionId: string | null = null
    if (paidAt) {
      const source: TransactionSourceDetail = { ...emptySource('MonthlyPayment', id), memberName: name, year, month, status: seed.status, paidAt }
      transactionId = addTx(seed.member, name, seed.amount, 'Income', 'MonthlyPayment', paidAt, `Monthly payment - ${mmyyyy(seed.offset)} - ${name}`, source, seed.status === 'Cancelled')
    }
    const createdAt = paidAt ?? at(seed.offset, seed.day, 9)
    const summary: LogEntitySummary = { memberName: name, year, month, status: seed.status, amount: seed.amount, transactionId, activityId: null, activityName: null }
    addLog('MonthlyPayment', id, 'Create', createdAt, null, seed.amount, summary)
    if (seed.status === 'Cancelled') addLog('MonthlyPayment', id, 'Delete', at(seed.offset, seed.day + 1), seed.amount, null, summary)
    return { id, userId: seedByKey[seed.member].id, transactionId, amount: seed.amount, year, month, paidAt, status: seed.status, memberName: name }
  })
  const pendingSortKey = at(0, 1, 9)
  const feeSortKey = (payment: MonthlyPaymentResponse) => payment.paidAt ?? pendingSortKey
  const monthlyPayments = [...monthlyPaymentsAll].sort((a, b) => feeSortKey(b).localeCompare(feeSortKey(a)))
  const memberMonthlyPayments = monthlyPayments.filter(payment => payment.status === 'Paid') // MP-09

  // ---- Loans ---------------------------------------------------------------------------------
  const carlos = fullName('carlos')
  const diana = fullName('diana')
  const loanSource = (entity: string, id: string, name: string, status: string, initialAmount: number, startDate: string, endDate: string | null): TransactionSourceDetail =>
    ({ ...emptySource(entity, id), memberName: name, status, initialAmount, interestRate: 2, loanStartDate: startDate, loanEndDate: endDate })

  const L1 = guid(300)
  const L2 = guid(301)
  const l1Start = dateOnly(-2, 10)
  const l2Start = dateOnly(-3, 20)
  const l2End = dateOnly(-1, 5)

  const l1Tx = addTx('carlos', carlos, 300000, 'Expense', 'Loan', at(-2, 10), `Loan - ${carlos}`, loanSource('Loan', L1, carlos, 'Active', 300000, l1Start, null))
  const l2Tx = addTx('diana', diana, 100000, 'Expense', 'Loan', at(-3, 20), `Loan - ${diana}`, loanSource('Loan', L2, diana, 'Paid', 100000, l2Start, l2End))
  addLog('Loan', L1, 'Create', at(-2, 10), null, 300000)
  addLog('Loan', L2, 'Create', at(-3, 20), null, 100000)

  const P1 = guid(310)
  const P2 = guid(311)
  const P3 = guid(312)
  const loanPaymentTx = (id: string, owner: MemberKey, name: string, loanStatus: string, initial: number, start: string, end: string | null, amount: number, paidAt: string, method: 'Cash' | 'Transfer', isCancelled: boolean) =>
    addTx(owner, name, amount, 'Income', 'LoanPayment', paidAt, `Loan payment - ${name}`,
      { ...loanSource('LoanPayment', id, name, loanStatus, initial, start, end), paidAt, paymentMethod: method }, isCancelled)
  const p1Paid = at(-1, 10)
  const p2Paid = at(-1, 12)
  const p3Paid = at(-1, 5)
  const p1Tx = loanPaymentTx(P1, 'carlos', carlos, 'Active', 300000, l1Start, null, 100000, p1Paid, 'Cash', false)
  const p2Tx = loanPaymentTx(P2, 'carlos', carlos, 'Active', 300000, l1Start, null, 50000, p2Paid, 'Transfer', true)
  const p3Tx = loanPaymentTx(P3, 'diana', diana, 'Paid', 100000, l2Start, l2End, 100000, p3Paid, 'Transfer', false)
  addLog('LoanPayment', P1, 'Create', p1Paid, null, 100000)
  addLog('LoanPayment', P2, 'Create', p2Paid, null, 50000)
  addLog('LoanPayment', P2, 'Delete', at(-1, 13), 50000, null)
  addLog('LoanPayment', P3, 'Create', p3Paid, null, 100000)

  const I1 = guid(320)
  const I2 = guid(321)
  const I3 = guid(322)
  const interestTx = (id: string, owner: MemberKey, name: string, loanStatus: string, initial: number, start: string, end: string | null, amount: number, paidAt: string, description: string) =>
    addTx(owner, name, amount, 'Income', 'Performance', paidAt, `Loan interest - ${name}`,
      { ...loanSource('Performance', id, name, loanStatus, initial, start, end), status: 'Paid', paidAt, activityDescription: description })
  const i1Paid = at(-1, 10)
  const i3Paid = at(-2, 20)
  const i1Tx = interestTx(I1, 'carlos', carlos, 'Active', 300000, l1Start, null, 6000, i1Paid, 'Interés del primer mes')
  const i3Tx = interestTx(I3, 'diana', diana, 'Paid', 100000, l2Start, l2End, 4000, i3Paid, 'Interés de dos meses')
  addLog('Performance', I1, 'Create', i1Paid, null, 6000)
  addLog('Performance', I2, 'Create', at(0, 1, 9), null, 4000)
  addLog('Performance', I3, 'Create', i3Paid, null, 4000)

  const loanPayment = (id: string, loanId: string, transactionId: string, amount: number, paidAt: string, paymentMethod: 'Cash' | 'Transfer', status: 'Paid' | 'Cancelled'): LoanPaymentResponse =>
    ({ id, loanId, transactionId, amount, paidAt, paymentMethod, status })
  const interestPayment = (id: string, loanId: string, transactionId: string | null, amount: number, description: string, status: 'Pending' | 'Paid', createdAt: string, paidAt: string | null): InterestPaymentResponse =>
    ({ id, loanId, transactionId, amount, description, status, createdAt, paidAt })

  // Summaries are literals (LOAN-06, LoanService.ToDetail); the DEMO-06 test recomputes them.
  const loanDetails: Record<string, LoanDetail> = {
    [L1]: {
      id: L1, transactionId: l1Tx, borrowerId: seedByKey.carlos.id, borrowerName: carlos, initialAmount: 300000, interestRate: 2, startDate: l1Start,
      endDate: null, status: 'Active', createdAt: at(-2, 10), updatedAt: null,
      summary: { principalPaid: 100000, outstandingPrincipal: 200000, interestGenerated: 10000, interestPaid: 6000, outstandingInterest: 4000, totalOutstanding: 204000 },
      payments: [loanPayment(P1, L1, p1Tx, 100000, p1Paid, 'Cash', 'Paid'), loanPayment(P2, L1, p2Tx, 50000, p2Paid, 'Transfer', 'Cancelled')],
      interestPayments: [
        interestPayment(I1, L1, i1Tx, 6000, 'Interés del primer mes', 'Paid', at(-1, 10), i1Paid),
        interestPayment(I2, L1, null, 4000, 'Interés del segundo mes', 'Pending', at(0, 1, 9), null),
      ],
    },
    [L2]: {
      id: L2, transactionId: l2Tx, borrowerId: seedByKey.diana.id, borrowerName: diana, initialAmount: 100000, interestRate: 2, startDate: l2Start,
      endDate: l2End, status: 'Paid', createdAt: at(-3, 20), updatedAt: at(-1, 5),
      summary: { principalPaid: 100000, outstandingPrincipal: 0, interestGenerated: 4000, interestPaid: 4000, outstandingInterest: 0, totalOutstanding: 0 },
      payments: [loanPayment(P3, L2, p3Tx, 100000, p3Paid, 'Transfer', 'Paid')],
      interestPayments: [interestPayment(I3, L2, i3Tx, 4000, 'Interés de dos meses', 'Paid', i3Paid, i3Paid)],
    },
  }
  const loans: LoanListItem[] = [loanDetails[L1], loanDetails[L2]].map(loan => ({
    id: loan.id, borrowerId: loan.borrowerId, borrowerName: loan.borrowerName, initialAmount: loan.initialAmount, interestRate: loan.interestRate,
    startDate: loan.startDate, status: loan.status, outstandingPrincipal: loan.summary.outstandingPrincipal,
    hasMovements: loan.payments.some(payment => payment.status !== 'Cancelled') || loan.interestPayments.some(interest => interest.status !== 'Cancelled'),
  }))
  loans.sort((a, b) => b.startDate.localeCompare(a.startDate)) // startDate desc

  // ---- Activity ------------------------------------------------------------------------------
  const A1 = guid(400)
  const aName = 'Venta de tamales'
  const aDescription = 'Tamales para vender en la reunión familiar'
  const aStart = dateOnly(-1, 15)
  const activityTx = addTx(null, null, 240000, 'Expense', 'Activity', at(-1, 15), `Activity - ${aName}`,
    { ...emptySource('Activity', A1), status: 'Pending', activityName: aName, activityDescription: aDescription, activityQuantity: 40, unitCost: 6000, unitSalePrice: 10000, startDate: aStart })
  addLog('Activity', A1, 'Create', at(-1, 15), null, 240000)

  const assignmentSource = (id: string, key: MemberKey, status: string, quantity: number, paidAt: string | null, assignedAt: string): TransactionSourceDetail =>
    ({ ...emptySource('ActivityAssignment', id), memberName: fullName(key), status, paidAt, activityName: aName, activityDescription: aDescription, activityQuantity: 40,
      quantityAssigned: quantity, unitCost: 6000, unitSalePrice: 10000, startDate: aStart, assignedAt })

  const S1 = guid(410)
  const S2 = guid(411)
  const S3 = guid(412)
  const S4 = guid(413)
  const s1Assigned = at(-1, 20)
  const s1Paid = at(-1, 28)
  const s4Assigned = at(-1, 26)
  const s4Paid = at(0, 1, 16)
  const s1Tx = addTx('diana', diana, 120000, 'Income', 'ActivitySale', s1Paid, `Activity sale - ${aName} - ${diana}`, assignmentSource(S1, 'diana', 'Paid', 12, s1Paid, s1Assigned))
  const s4Tx = addTx('laura', fullName('laura'), 100000, 'Income', 'ActivitySale', s4Paid, `Activity sale - ${aName} - ${fullName('laura')}`, assignmentSource(S4, 'laura', 'Paid', 10, s4Paid, s4Assigned))
  addLog('ActivityAssignment', S1, 'Create', s1Assigned, null, 100000)
  addLog('ActivityAssignment', S1, 'Update', s1Paid, 100000, 120000)
  addLog('ActivityAssignment', S2, 'Create', at(-1, 22), null, 50000)
  addLog('ActivityAssignment', S2, 'Delete', at(-1, 23), 50000, null)
  addLog('ActivityAssignment', S3, 'Create', at(-1, 25), null, 80000)
  addLog('ActivityAssignment', S4, 'Create', s4Assigned, null, 100000)
  addLog('ActivityAssignment', S4, 'Update', s4Paid, 100000, 100000)

  const assignment = (id: string, key: MemberKey, quantity: number, saleAmount: number, status: ActivityAssignmentResponse['status'], assignedAt: string, paidAt: string | null, transactionId: string | null): ActivityAssignmentResponse =>
    ({ id, activityId: A1, userId: seedByKey[key].id, memberName: fullName(key), quantityAssigned: quantity, saleAmount, status, assignedAt, paidAt, transactionId })

  const activityList: ActivityListItem = {
    id: A1, name: aName, description: aDescription, quantity: 40, unitCost: 6000, unitSalePrice: 10000, totalCost: 240000,
    assignedQuantity: 30, availableQuantity: 10, startDate: aStart, status: 'Pending',
  }
  const activityDetails: Record<string, ActivityDetail> = {
    [A1]: {
      ...activityList, transactionId: activityTx, createdAt: at(-1, 15),
      assignments: [
        assignment(S1, 'diana', 12, 120000, 'Paid', s1Assigned, s1Paid, s1Tx),
        assignment(S2, 'carlos', 5, 50000, 'Cancelled', at(-1, 22), null, null),
        assignment(S3, 'sofia', 8, 80000, 'Pending', at(-1, 25), null, null),
        assignment(S4, 'laura', 10, 100000, 'Paid', s4Assigned, s4Paid, s4Tx),
      ],
      extraCosts: [], // spec 020: extra costs are not part of the demo
    },
  }
  const activities: ActivityListItem[] = [activityList]

  // ---- Transactions (newest first, cancelled included) ---------------------------------------
  const ordered = [...txRecords].sort((a, b) => b.tx.occurredAt.localeCompare(a.tx.occurredAt))
  const transactions: DemoTransaction[] = ordered.map(record => record.tx)
  const transactionDetails: Record<string, DemoTransactionDetail> = Object.fromEntries(
    txRecords.map(record => [record.tx.id, { ...record.tx, source: record.source }]),
  )

  // ---- Logs (newest first) -------------------------------------------------------------------
  const emptySummary: LogEntitySummary = { memberName: null, year: null, month: null, status: null, amount: null, transactionId: null, activityId: null, activityName: null }
  const sortedLogs = [...logRecords].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.seq - a.seq)
  const logId = (record: LogRecord) => guid(500 + record.seq)
  const logs: LogListItem[] = sortedLogs.map(record => ({
    id: logId(record), entityType: record.entityType, entityId: record.entityId, action: record.action, occurredAt: record.occurredAt,
    oldValue: record.oldValue, newValue: record.newValue, userId: ADMIN_ID, userName: 'Admin Demo',
  }))
  const logDetails: Record<string, LogDetail> = Object.fromEntries(
    sortedLogs.map((record, index) => [logId(record), {
      ...logs[index], userEmail: adminUser.email,
      entitySummary: record.entityType === 'MonthlyPayment' && record.summary ? record.summary : emptySummary, // AUD-02
    }]),
  )

  // ---- Member details ------------------------------------------------------------------------
  const memberDetails: Record<string, MemberDetail> = Object.fromEntries(memberSeeds.map(seed => {
    const pendingPayments: MemberPendingPayment[] = monthlyPaymentsAll
      .filter(payment => payment.userId === seed.id && payment.status === 'Pending')
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map(payment => ({ id: payment.id, year: payment.year, month: payment.month, amount: payment.amount, status: payment.status, createdAt: pendingSortKey, transactionId: payment.transactionId }))
    // Items are existing entities filtered like the backend (MEM-10); amounts are the literals in the seed.
    const pendingObligations: PendingObligations = {
      total: seed.pending.total,
      monthlyPayments: {
        count: pendingPayments.length, amount: seed.pending.monthlyPayments,
        items: pendingPayments.map(payment => ({ id: payment.id, year: payment.year, month: payment.month, amount: payment.amount })),
      },
      loans: (() => {
        const items = Object.values(loanDetails)
          .filter(loan => loan.borrowerId === seed.id && loan.status === 'Active' && loan.summary.outstandingPrincipal > 0)
          .map(loan => ({ id: loan.id, startDate: loan.startDate, initialAmount: loan.initialAmount, outstandingPrincipal: loan.summary.outstandingPrincipal }))
        return { count: items.length, amount: seed.pending.loans, items }
      })(),
      interests: (() => {
        const items = Object.values(loanDetails)
          .filter(loan => loan.borrowerId === seed.id)
          .flatMap(loan => loan.interestPayments)
          .filter(interest => interest.status === 'Pending')
          .map(interest => ({ id: interest.id, loanId: interest.loanId, createdAt: interest.createdAt, amount: interest.amount }))
        return { count: items.length, amount: seed.pending.interests, items }
      })(),
      activitySales: (() => {
        const items = Object.values(activityDetails)
          .flatMap(activity => activity.assignments.map(item => ({ activity, item })))
          .filter(({ item }) => item.userId === seed.id && item.status === 'Pending')
          .map(({ activity, item }) => ({ id: item.id, activityId: activity.id, activityName: activity.name, quantity: item.quantityAssigned, salePrice: activity.unitSalePrice, amount: item.saleAmount }))
        return { count: items.length, amount: seed.pending.activitySales, items }
      })(),
    }
    const own = txRecords
      .filter(record => record.owner === seed.key && !record.tx.isCancelled)
      .sort((a, b) => a.tx.occurredAt.localeCompare(b.tx.occurredAt))
      .map(({ tx }) => ({ id: tx.id, amount: tx.amount, direction: tx.direction, type: tx.type, occurredAt: tx.occurredAt, description: tx.description }))
    const detail: MemberDetail = {
      member: { id: seed.id, firstName: seed.firstName, lastName: seed.lastName, email: seed.email, phone: seed.phone, role: 'Member', isActive: seed.isActive, createdAt: at(-4, 1), updatedAt: null },
      balance: seed.balance,
      pendingPayments,
      transactions: own,
      pendingObligations,
    }
    return [seed.id, detail]
  }))

  // ---- Dashboard -----------------------------------------------------------------------------
  const recentTransactions: DashboardTransaction[] = transactions.filter(tx => !tx.isCancelled).slice(0, 10)
    .map(({ id, amount, direction, type, occurredAt, description, memberName }) => ({ id, amount, direction, type, occurredAt, description, memberName }))
  const topSellers: TopSeller[] = [
    { userId: seedByKey.diana.id, memberName: diana, unitsSold: 12, collectedAmount: 120000, earnings: 48000 },
    { userId: seedByKey.laura.id, memberName: fullName('laura'), unitsSold: 10, collectedAmount: 100000, earnings: 40000 },
  ]
  // DASH-14: rows derived from the member details (same amounts as the member detail "Debe"), total desc then name.
  const membersPendingObligations: MemberPendingObligations[] = members
    .map(member => ({ member, pending: memberDetails[member.id].pendingObligations! }))
    .filter(({ pending }) => pending.total > 0)
    .map(({ member, pending }) => ({
      userId: member.id, memberName: `${member.firstName} ${member.lastName}`, isActive: member.isActive, total: pending.total,
      monthlyPayments: { count: pending.monthlyPayments.count, amount: pending.monthlyPayments.amount },
      loans: { count: pending.loans.count, amount: pending.loans.amount },
      interests: { count: pending.interests.count, amount: pending.interests.amount },
      activitySales: { count: pending.activitySales.count, amount: pending.activitySales.amount },
    }))
    .sort((a, b) => b.total - a.total || a.memberName.localeCompare(b.memberName, 'es'))
  const adminSummary: DashboardSummary = {
    role: 'Admin', availableMoney: 740000, totalNatilleraBalance: 988000, lentMoney: 200000, pendingActivitiesInvestment: 48000,
    mySavings: null, myEarnings: null, pendingPayments: null, recentTransactions, topSellers, myPaidMonthlyPayments: null,
    loanInterestEarned: 10000, activityEarnings: 88000, myActivityEarnings: null, myPerformanceShare: null, // DASH-03: margin of Paid assignments = 22 units x (10000 - 6000)
    pendingObligations: null, sharedInterestPool: 10000, paidExtraCosts: 0, paidMonthlyPayments: 950000, membersPendingObligations,
  }
  const memberSummary: DashboardSummary = {
    role: 'Member', availableMoney: 740000, totalNatilleraBalance: null, lentMoney: null, pendingActivitiesInvestment: null,
    mySavings: 192000, myEarnings: 42000, pendingPayments: 1, recentTransactions, topSellers, myPaidMonthlyPayments: 150000,
    loanInterestEarned: null, activityEarnings: null, myActivityEarnings: 40000, myPerformanceShare: 2000,
    pendingObligations: memberDetails[seedByKey[DEMO_MEMBER].id].pendingObligations, sharedInterestPool: null, paidExtraCosts: null, paidMonthlyPayments: null, membersPendingObligations: null,
  }

  return {
    adminUser: demoUsers.admin, memberUser: demoUsers.member, demoMemberId: seedByKey[DEMO_MEMBER].id, members, memberDetails,
    monthlyPayments, memberMonthlyPayments, loans, loanDetails, activities, activityDetails, transactions, transactionDetails,
    logs, logDetails, adminSummary, memberSummary,
  }
}
