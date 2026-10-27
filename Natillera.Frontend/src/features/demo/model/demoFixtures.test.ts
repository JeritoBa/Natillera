import { describe, expect, it } from 'vitest'
import { buildDemoFixtures, type DemoFixtures } from '@/features/demo/model/demoFixtures'

const NOW = new Date('2026-10-14T12:00:00Z')
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

// Both a mid-year date and a January date (month offsets roll over to the previous year).
const scenarios: [string, Date][] = [['October', NOW], ['January', new Date('2027-01-20T12:00:00Z')]]

describe.each(scenarios)('demo fixtures (%s)', (_label, now) => {
  const f: DemoFixtures = buildDemoFixtures(now)
  const live = f.transactions.filter(tx => !tx.isCancelled)
  const monthlyPaymentById = Object.fromEntries(f.monthlyPayments.map(payment => [payment.id, payment]))
  const assignments = Object.values(f.activityDetails).flatMap(activity => activity.assignments)
  const interestPayments = Object.values(f.loanDetails).flatMap(loan => loan.interestPayments)
  const loanPayments = Object.values(f.loanDetails).flatMap(loan => loan.payments)

  it('DEMO-06 / FIN-09: available money equals Income minus Expense of non-cancelled transactions', () => {
    const income = sum(live.filter(tx => tx.direction === 'Income').map(tx => tx.amount))
    const expense = sum(live.filter(tx => tx.direction === 'Expense').map(tx => tx.amount))
    expect(f.adminSummary.availableMoney).toBe(income - expense)
    expect(f.memberSummary.availableMoney).toBe(income - expense)
  })

  it('DEMO-06 / FIN-04: transaction directions match their type', () => {
    for (const tx of f.transactions) {
      const expected = tx.type === 'Loan' || tx.type === 'Activity' ? 'Expense' : 'Income'
      expect(tx.direction, tx.description).toBe(expected)
    }
  })

  it('DEMO-06: cash never goes negative chronologically', () => {
    let cash = 0
    for (const tx of [...live].reverse()) {
      cash += tx.direction === 'Income' ? tx.amount : -tx.amount
      expect(cash, tx.description).toBeGreaterThanOrEqual(0)
    }
  })

  it('DEMO-06 / DASH-02/03: admin summary figures are recomputed from entities', () => {
    const lent = sum(Object.values(f.loanDetails).filter(loan => loan.status === 'Active').map(loan => loan.summary.outstandingPrincipal))
    const pendingInvestment = sum(assignments.filter(item => item.status === 'Pending').map(item => item.quantityAssigned * 6000))
    const interestEarned = sum(interestPayments.filter(item => item.status === 'Paid').map(item => item.amount))
    // DASH-03 (spec 029): earned so far = margin of the Paid assignments, never negative.
    const activityEarnings = sum(assignments.filter(item => item.status === 'Paid').map(item => item.quantityAssigned * (10000 - 6000)))
    expect(f.adminSummary.lentMoney).toBe(lent)
    expect(f.adminSummary.pendingActivitiesInvestment).toBe(pendingInvestment)
    expect(f.adminSummary.totalNatilleraBalance).toBe(f.adminSummary.availableMoney + lent + pendingInvestment)
    expect(f.adminSummary.loanInterestEarned).toBe(interestEarned)
    expect(f.adminSummary.activityEarnings).toBe(activityEarnings)
    expect(f.adminSummary.role).toBe('Admin')
    expect(f.adminSummary.mySavings).toBeNull()
  })

  it('DEMO-06 / DASH-13: paid fees equal the non-cancelled MonthlyPayment income and the interest pool is consistent', () => {
    const feeIncome = sum(live.filter(tx => tx.type === 'MonthlyPayment').map(tx => tx.amount))
    expect(f.adminSummary.paidMonthlyPayments).toBe(feeIncome)
    expect(f.adminSummary.paidMonthlyPayments).toBe(sum(f.monthlyPayments.filter(payment => payment.status === 'Paid').map(payment => payment.amount)))
    expect(f.adminSummary.sharedInterestPool).toBe(f.adminSummary.loanInterestEarned! - f.adminSummary.paidExtraCosts!)
    expect(f.memberSummary.paidMonthlyPayments).toBeNull()
  })

  it('DEMO-06 / DASH-14: pending rows equal the member details (total > 0, total desc); member summary has none', () => {
    const rows = f.adminSummary.membersPendingObligations!
    const owing = f.members.filter(member => f.memberDetails[member.id].pendingObligations.total > 0)
    expect(rows.map(row => row.userId).sort()).toEqual(owing.map(member => member.id).sort())
    for (const row of rows) {
      const o = f.memberDetails[row.userId].pendingObligations
      expect(row.total).toBe(o.total)
      expect(row.monthlyPayments).toEqual({ count: o.monthlyPayments.count, amount: o.monthlyPayments.amount })
      expect(row.loans).toEqual({ count: o.loans.count, amount: o.loans.amount })
      expect(row.interests).toEqual({ count: o.interests.count, amount: o.interests.amount })
      expect(row.activitySales).toEqual({ count: o.activitySales.count, amount: o.activitySales.amount })
    }
    const totals = rows.map(row => row.total)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
    expect(f.memberSummary.membersPendingObligations).toBeNull()
  })

  it('DEMO-06 / DASH-09: top sellers come from Paid assignments, earnings desc', () => {
    const paid = assignments.filter(item => item.status === 'Paid')
    expect(f.adminSummary.topSellers).toHaveLength(paid.length)
    for (const seller of f.adminSummary.topSellers) {
      const item = paid.find(candidate => candidate.userId === seller.userId)!
      expect(seller.unitsSold).toBe(item.quantityAssigned)
      expect(seller.collectedAmount).toBe(item.saleAmount)
      expect(seller.earnings).toBe(item.saleAmount - item.quantityAssigned * 6000)
    }
    const earnings = f.adminSummary.topSellers.map(seller => seller.earnings)
    expect(earnings).toEqual([...earnings].sort((a, b) => b - a))
  })

  it('DEMO-06 / DASH: recent transactions are the 10 newest non-cancelled', () => {
    expect(f.adminSummary.recentTransactions.map(tx => tx.id)).toEqual(live.slice(0, 10).map(tx => tx.id))
    expect(f.memberSummary.recentTransactions).toEqual(f.adminSummary.recentTransactions)
  })

  it('DEMO-06 / DASH-04..08: member summary and every member detail are recomputed', () => {
    const activeMembers = f.members.filter(member => member.isActive).length
    const share = Math.round((sum(interestPayments.filter(item => item.status === 'Paid').map(item => item.amount)) / activeMembers) * 100) / 100
    for (const member of f.members) {
      const detail = f.memberDetails[member.id]
      const savings = sum(f.monthlyPayments.filter(payment => payment.userId === member.id && payment.status === 'Paid').map(payment => payment.amount))
      const earnings = sum(assignments.filter(item => item.userId === member.id && item.status !== 'Cancelled').map(item => item.saleAmount - item.quantityAssigned * 6000))
      expect(detail.balance.savings, member.firstName).toBe(savings)
      expect(detail.balance.activityEarnings, member.firstName).toBe(earnings)
      expect(detail.balance.performanceEarnings, member.firstName).toBe(share)
      expect(detail.balance.total, member.firstName).toBe(savings + earnings + share)
      expect(detail.member.role).toBe('Member')
    }
    const me = f.memberDetails[f.demoMemberId]
    expect(f.memberSummary.role).toBe('Member')
    expect(f.memberSummary.myPaidMonthlyPayments).toBe(me.balance.savings)
    expect(f.memberSummary.myActivityEarnings).toBe(me.balance.activityEarnings)
    expect(f.memberSummary.myPerformanceShare).toBe(me.balance.performanceEarnings)
    expect(f.memberSummary.mySavings).toBe(me.balance.total)
    expect(f.memberSummary.myEarnings).toBe(me.balance.activityEarnings + me.balance.performanceEarnings)
    expect(f.memberSummary.pendingPayments).toBe(me.pendingPayments.length)
    expect(f.memberSummary.totalNatilleraBalance).toBeNull()
  })

  it('DEMO-06 / MEM-10 / DASH-11: pending obligations are recomputed for every member', () => {
    const details = Object.values(f.loanDetails)
    const kindsSeen = new Set<string>()
    for (const member of f.members) {
      const o = f.memberDetails[member.id].pendingObligations
      const fees = f.monthlyPayments.filter(payment => payment.userId === member.id && payment.status === 'Pending')
      const loans = details.filter(loan => loan.borrowerId === member.id && loan.status === 'Active' && loan.summary.outstandingPrincipal > 0)
      const interests = details.filter(loan => loan.borrowerId === member.id).flatMap(loan => loan.interestPayments).filter(item => item.status === 'Pending')
      const sales = assignments.filter(item => item.userId === member.id && item.status === 'Pending')

      expect(o.monthlyPayments.count, member.firstName).toBe(fees.length)
      expect(o.monthlyPayments.amount, member.firstName).toBe(sum(fees.map(payment => payment.amount)))
      expect(o.monthlyPayments.items.map(item => item.id)).toEqual(fees.map(payment => payment.id).sort((a, b) => {
        const left = monthlyPaymentById[a]
        const right = monthlyPaymentById[b]
        return left.year - right.year || left.month - right.month
      }))
      expect(o.loans.count, member.firstName).toBe(loans.length)
      expect(o.loans.amount, member.firstName).toBe(sum(loans.map(loan => loan.summary.outstandingPrincipal)))
      expect(o.loans.items.map(item => item.id)).toEqual(loans.map(loan => loan.id))
      expect(o.interests.count, member.firstName).toBe(interests.length)
      expect(o.interests.amount, member.firstName).toBe(sum(interests.map(item => item.amount)))
      expect(o.interests.items.map(item => item.id)).toEqual(interests.map(item => item.id))
      expect(o.activitySales.count, member.firstName).toBe(sales.length)
      expect(o.activitySales.amount, member.firstName).toBe(sum(sales.map(item => item.saleAmount)))
      expect(o.activitySales.items.map(item => item.id)).toEqual(sales.map(item => item.id))
      expect(o.total, member.firstName).toBe(o.monthlyPayments.amount + o.loans.amount + o.interests.amount + o.activitySales.amount)

      // Cancelled or Paid records never appear.
      const listed = [...o.monthlyPayments.items, ...o.loans.items, ...o.interests.items, ...o.activitySales.items].map(item => item.id)
      const settled = [
        ...f.monthlyPayments.filter(payment => payment.status !== 'Pending').map(payment => payment.id),
        ...details.filter(loan => loan.status !== 'Active').map(loan => loan.id),
        ...details.flatMap(loan => loan.interestPayments).filter(item => item.status !== 'Pending').map(item => item.id),
        ...assignments.filter(item => item.status !== 'Pending').map(item => item.id),
      ]
      for (const id of listed) expect(settled.includes(id), id).toBe(false)

      expect(f.memberDetails[member.id].pendingPayments).toHaveLength(o.monthlyPayments.count)
      if (o.monthlyPayments.count) kindsSeen.add('fees')
      if (o.loans.count) kindsSeen.add('loans')
      if (o.interests.count) kindsSeen.add('interests')
      if (o.activitySales.count) kindsSeen.add('sales')
      if (o.total === 0) kindsSeen.add('nothing')
    }
    expect([...kindsSeen].sort()).toEqual(['fees', 'interests', 'loans', 'nothing', 'sales'])
    expect(f.memberSummary.pendingObligations).toEqual(f.memberDetails[f.demoMemberId].pendingObligations)
    expect(f.memberSummary.pendingPayments).toBe(f.memberSummary.pendingObligations!.monthlyPayments.count)
    expect(f.adminSummary.pendingObligations).toBeNull()
  })

  it('DEMO-06 / MP-04: one live fee per member and month', () => {
    const seen = new Set<string>()
    for (const payment of f.monthlyPayments.filter(item => item.status !== 'Cancelled')) {
      const key = `${payment.userId}-${payment.year}-${payment.month}`
      expect(seen.has(key), key).toBe(false)
      seen.add(key)
    }
  })

  it('DEMO-06 / FIN-01: one Transaction per paid or active entity; pending has none; cancelled is flagged', () => {
    const txById = Object.fromEntries(f.transactions.map(tx => [tx.id, tx]))
    const referenced: string[] = []
    const check = (status: string, transactionId: string | null, label: string) => {
      if (status === 'Pending') { expect(transactionId, label).toBeNull(); return }
      expect(transactionId, label).not.toBeNull()
      referenced.push(transactionId!)
      expect(txById[transactionId!].isCancelled, label).toBe(status === 'Cancelled')
    }
    for (const payment of f.monthlyPayments) check(payment.status, payment.transactionId, `fee ${payment.id}`)
    for (const item of interestPayments) check(item.status, item.transactionId, `interest ${item.id}`)
    for (const item of loanPayments) check(item.status, item.transactionId, `loan payment ${item.id}`)
    for (const item of assignments) {
      if (item.status === 'Cancelled' && item.transactionId === null) continue // cancelled while pending: never had one
      check(item.status, item.transactionId, `assignment ${item.id}`)
    }
    for (const loan of Object.values(f.loanDetails)) { referenced.push(loan.transactionId); expect(txById[loan.transactionId].isCancelled).toBe(false) }
    for (const activity of Object.values(f.activityDetails)) { referenced.push(activity.transactionId); expect(txById[activity.transactionId].isCancelled).toBe(false) }
    expect(new Set(referenced).size).toBe(referenced.length) // no shared transactions
    expect([...referenced].sort()).toEqual(f.transactions.map(tx => tx.id).sort()) // no orphans
    expect(Object.keys(f.transactionDetails).sort()).toEqual(f.transactions.map(tx => tx.id).sort())
  })

  it('DEMO-06 / LOAN-06: loan summaries are recomputed and list matches detail', () => {
    for (const loan of Object.values(f.loanDetails)) {
      const paid = sum(loan.payments.filter(item => item.status !== 'Cancelled').map(item => item.amount))
      const generated = sum(loan.interestPayments.filter(item => item.status !== 'Cancelled').map(item => item.amount))
      const interestPaid = sum(loan.interestPayments.filter(item => item.status === 'Paid').map(item => item.amount))
      const pending = sum(loan.interestPayments.filter(item => item.status === 'Pending').map(item => item.amount))
      expect(loan.summary).toEqual({
        principalPaid: paid, outstandingPrincipal: loan.initialAmount - paid, interestGenerated: generated,
        interestPaid, outstandingInterest: pending, totalOutstanding: loan.initialAmount - paid + pending,
      })
      expect(loan.summary.outstandingPrincipal).toBeGreaterThanOrEqual(0)
      const closed = loan.summary.outstandingPrincipal === 0 && pending === 0
      expect(loan.status).toBe(closed ? 'Paid' : 'Active')
      expect(loan.endDate !== null).toBe(closed)
      expect(f.loans.find(item => item.id === loan.id)!.outstandingPrincipal).toBe(loan.summary.outstandingPrincipal)
    }
    expect(f.loans.map(loan => loan.startDate)).toEqual([...f.loans.map(loan => loan.startDate)].sort().reverse())
  })

  it('DEMO-06 / ACT-07/10: activity quantities and sale amounts', () => {
    for (const activity of Object.values(f.activityDetails)) {
      const assigned = sum(activity.assignments.filter(item => item.status !== 'Cancelled').map(item => item.quantityAssigned))
      expect(activity.assignedQuantity).toBe(assigned)
      expect(activity.availableQuantity).toBe(activity.quantity - assigned)
      expect(activity.totalCost).toBe(activity.quantity * activity.unitCost)
      for (const item of activity.assignments) expect(item.saleAmount).toBe(item.quantityAssigned * activity.unitSalePrice)
      const allPaid = activity.availableQuantity === 0 && activity.assignments.filter(item => item.status !== 'Cancelled').every(item => item.status === 'Paid')
      expect(activity.status).toBe(allPaid ? 'Finished' : 'Pending')
      expect(f.activities.find(item => item.id === activity.id)!.assignedQuantity).toBe(assigned)
    }
  })

  it('DEMO-06 / MP-09: member fee list contains only Paid fees', () => {
    expect(f.memberMonthlyPayments.length).toBeGreaterThan(0)
    expect(f.memberMonthlyPayments.every(payment => payment.status === 'Paid')).toBe(true)
    expect(f.monthlyPayments.some(payment => payment.status === 'Pending')).toBe(true)
    expect(f.monthlyPayments.some(payment => payment.status === 'Cancelled')).toBe(true)
  })

  it('DEMO-06 / AUD-02: logs reference existing entities and only fees carry an entity summary', () => {
    const entityIds = new Set<string>([
      ...f.monthlyPayments.map(item => item.id), ...Object.keys(f.loanDetails), ...Object.keys(f.activityDetails),
      ...loanPayments.map(item => item.id), ...interestPayments.map(item => item.id), ...assignments.map(item => item.id),
    ])
    for (const log of f.logs) {
      expect(entityIds.has(log.entityId), log.id).toBe(true)
      const detail = f.logDetails[log.id]
      expect(detail.id).toBe(log.id)
      if (log.entityType === 'MonthlyPayment') {
        expect(detail.entitySummary.memberName).toBe(monthlyPaymentById[log.entityId].memberName)
      } else {
        expect(Object.values(detail.entitySummary).every(value => value === null)).toBe(true)
      }
      if (log.action === 'Create') { expect(log.oldValue).toBeNull(); expect(log.newValue).not.toBeNull() }
      if (log.action === 'Delete') { expect(log.oldValue).not.toBeNull(); expect(log.newValue).toBeNull() }
    }
    expect(Object.keys(f.logDetails)).toHaveLength(f.logs.length)
    const times = f.logs.map(log => log.occurredAt)
    expect(times).toEqual([...times].sort().reverse())
    // Every cancelled entity has its Delete log.
    for (const payment of f.monthlyPayments.filter(item => item.status === 'Cancelled')) {
      expect(f.logs.some(log => log.entityId === payment.id && log.action === 'Delete')).toBe(true)
    }
  })

  it('DEMO-06: every list item has a detail and members are fictitious', () => {
    for (const loan of f.loans) expect(f.loanDetails[loan.id]).toBeDefined()
    for (const activity of f.activities) expect(f.activityDetails[activity.id]).toBeDefined()
    for (const member of f.members) expect(f.memberDetails[member.id]).toBeDefined()
    for (const member of f.members) expect(member.email.endsWith('@example.com')).toBe(true) // DEMO-03
    expect(f.adminUser.email.endsWith('@example.com')).toBe(true)
    expect(f.members.some(member => member.id === f.adminUser.id)).toBe(false)
    expect(f.members.find(member => member.id === f.demoMemberId)).toBeDefined()
    expect(f.memberUser.id).toBe(f.demoMemberId)
  })

  it('DEMO-06 / spec criterion 7: dates are relative to the current month', () => {
    const endOfMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    const latest = f.monthlyPayments.reduce((best, payment) => Math.max(best, payment.year * 12 + payment.month), 0)
    expect(latest).toBe(now.getUTCFullYear() * 12 + now.getUTCMonth() + 1)
    const dates = [
      ...f.transactions.map(tx => tx.occurredAt), ...f.logs.map(log => log.occurredAt),
      ...f.loans.map(loan => loan.startDate), ...f.activities.map(activity => activity.startDate),
    ]
    for (const date of dates) expect(new Date(date).getTime(), date).toBeLessThan(endOfMonth)
    expect(f.transactions[0].occurredAt.slice(0, 7)).toBe(now.toISOString().slice(0, 7))
  })

  it('DEMO-06: construction is deterministic', () => {
    expect(buildDemoFixtures(now)).toEqual(f)
  })
})
