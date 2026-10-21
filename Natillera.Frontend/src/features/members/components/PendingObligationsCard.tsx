import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateOnly } from '@/features/loans/model/labels'
import type { PendingObligations } from '@/features/members/api/membersApi'
import { assignmentPath, feePath, interestPath, loanPath, maxVisibleItems, pendingKinds, pendingSumLabel } from '@/features/members/model/pendingObligations'
import type { PendingKind } from '@/features/members/model/pendingObligations'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Icon } from '@/shared/ui/Icon'

const itemClass = 'flex items-center justify-between gap-3 min-h-11 py-2 px-2 -mx-2 rounded-md'
const linkItemClass = `${itemClass} hover:bg-[#f4f8f5] focus-visible:outline-2 focus-visible:outline-[#0c5c38]`
const formatTimestamp = (value: string) => new Date(value).toLocaleDateString('es-CO')

interface Props {
  obligations: PendingObligations
  audience: 'admin' | 'member'
  titleId: string
  // Needed by the Admin to link each fee to the payments list filtered by this member.
  memberId?: string
}

interface Item {
  id: string
  concept: string
  secondary?: string
  amount: number
  to?: string
}

function ItemRow({ item }: { item: Item }) {
  const content = <>
    <div className="min-w-0">
      <p className="truncate text-sm text-[#0c1a12]">{item.concept}</p>
      {item.secondary && <p className="text-xs text-[#4e7460] truncate">{item.secondary}</p>}
    </div>
    <span className="flex items-center gap-2 shrink-0">
      <span className="mono text-sm text-[#0c1a12] whitespace-nowrap">{formatCurrency(item.amount)}</span>
      {item.to && <span aria-hidden="true" className="text-[#4e7460]">›</span>}
    </span>
  </>
  return <li>
    {item.to
      ? <Link to={item.to} aria-label={`Ver ${item.concept}, debe ${formatCurrency(item.amount)}`} className={linkItemClass}>{content}</Link>
      : <div className={itemClass}>{content}</div>}
  </li>
}

function Group({ kind, items }: { kind: PendingKind; items: Item[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, maxVisibleItems)
  return <li className="border-t border-[#eef4f0] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#0c1a12]">{kind.label} <span className="font-normal text-[#4e7460]">({kind.count})</span></h3>
      <span className="mono text-sm font-semibold text-[#0c1a12] whitespace-nowrap">{formatCurrency(kind.amount)}</span>
    </div>
    <ul className="mt-1 divide-y divide-[#eef4f0]">{visible.map(item => <ItemRow key={item.id} item={item} />)}</ul>
    {items.length > maxVisibleItems && <button type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)} className="btn-ghost text-xs px-3 min-h-10 rounded-md">{showAll ? 'Ver menos' : `Ver todos (${items.length})`}</button>}
  </li>
}

// MEM-10: total owed and one group per kind with its items. The wrapping section is provided by the page.
export function PendingObligationsCard({ obligations, audience, titleId, memberId }: Props) {
  const kinds = pendingKinds(obligations)
  const isAdmin = audience === 'admin'

  const itemsByKind: Record<PendingKind['key'], Item[]> = {
    // MP-09: a Member cannot open the payments list of pending fees, so only the Admin gets a link.
    monthlyPayments: obligations.monthlyPayments.items.map(fee => ({
      id: fee.id, concept: `${formatMonth(fee.month)} ${fee.year}`, amount: fee.amount,
      to: isAdmin && memberId ? feePath(memberId, fee.year, fee.month) : undefined,
    })),
    loans: obligations.loans.items.map(loan => ({
      id: loan.id, concept: `Préstamo del ${formatDateOnly(loan.startDate)}`, secondary: `Prestado ${formatCurrency(loan.initialAmount)}`,
      amount: loan.outstandingPrincipal, to: loanPath(loan.id),
    })),
    interests: obligations.interests.items.map(interest => ({
      id: interest.id, concept: `Interés del ${formatTimestamp(interest.createdAt)}`, amount: interest.amount,
      to: interestPath(interest.loanId, interest.id),
    })),
    activitySales: obligations.activitySales.items.map(sale => ({
      id: sale.id, concept: sale.activityName, secondary: `${sale.quantity} ${sale.quantity === 1 ? 'unidad' : 'unidades'} × ${formatCurrency(sale.salePrice)}`,
      amount: sale.amount, to: assignmentPath(sale.activityId, sale.id),
    })),
  }

  return <>
    <h2 id={titleId} className="text-sm font-semibold text-[#0c1a12]">Pendientes por pagar</h2>
    {kinds.length === 0 ? <>
      <p className="flex items-center gap-2 mt-3 text-base font-semibold text-[#0a6635]"><span aria-hidden="true" className="w-7 h-7 rounded-full bg-[#dcf5e8] flex items-center justify-center"><Icon.Check /></span>Está al día</p>
      <p className="text-xs text-[#4e7460]">No tiene pagos pendientes.</p>
    </> : <>
      <p className="mono text-2xl font-bold text-[#9a6e00] mt-2 break-words">{isAdmin ? 'Debe' : 'Debes'} {formatCurrency(obligations.total)}</p>
      <p className="text-xs text-[#4e7460]">{pendingSumLabel(obligations)}</p>
      <ul className="mt-4">
        {kinds.map(kind => <Group key={kind.key} kind={kind} items={itemsByKind[kind.key]} />)}
      </ul>
    </>}
  </>
}
