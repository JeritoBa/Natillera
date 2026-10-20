import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDateOnly } from '@/features/loans/model/labels'
import type { PendingObligations } from '@/features/members/api/membersApi'
import { assignmentPath, interestPath, loanPath, pendingKinds } from '@/features/members/model/pendingObligations'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Icon } from '@/shared/ui/Icon'

const rowClass = 'flex justify-between gap-3 border-t border-[#eef4f0] pt-2'
const linkClass = 'block truncate text-[#0c1a12] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded'
const formatTimestamp = (value: string) => new Date(value).toLocaleDateString('es-CO')

interface Props {
  obligations: PendingObligations
  audience: 'admin' | 'member'
  titleId: string
}

function Row({ concept, secondary, amount }: { concept: ReactNode; secondary?: string; amount: number }) {
  return <li className={rowClass}>
    <div className="min-w-0">
      {concept}
      {secondary && <p className="text-xs text-[#4e7460] truncate">{secondary}</p>}
    </div>
    <span className="mono text-[#0c1a12] text-right whitespace-nowrap">{formatCurrency(amount)}</span>
  </li>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <>
    <h3 className="text-xs font-semibold text-[#4e7460] mt-4">{title}</h3>
    <ul className="mt-2 space-y-2 text-sm">{children}</ul>
  </>
}

// MEM-10: total owed, per-kind breakdown and the items of each kind. The wrapping section is provided by the page.
export function PendingObligationsCard({ obligations, audience, titleId }: Props) {
  const kinds = pendingKinds(obligations)
  const isAdmin = audience === 'admin'

  return <>
    <h2 id={titleId} className="text-sm font-semibold text-[#0c1a12]">Pendientes por pagar</h2>
    {kinds.length === 0 ? <>
      <p className="flex items-center gap-2 mt-3 text-base font-semibold text-[#0a6635]"><span aria-hidden="true" className="w-7 h-7 rounded-full bg-[#dcf5e8] flex items-center justify-center"><Icon.Check /></span>Está al día</p>
      <p className="text-xs text-[#4e7460]">No tiene pagos pendientes.</p>
    </> : <>
      <p className="mono text-2xl font-bold text-[#9a6e00] mt-2 break-words">{isAdmin ? 'Debe' : 'Debes'} {formatCurrency(obligations.total)}</p>
      <dl className="mt-3 space-y-2 text-sm">
        {kinds.map(kind => <div key={kind.key} className={rowClass}>
          <dt className="text-[#0c1a12]">{kind.label} ({kind.count})</dt>
          <dd className="mono text-[#0c1a12] whitespace-nowrap">{formatCurrency(kind.amount)}</dd>
        </div>)}
      </dl>

      {obligations.monthlyPayments.count > 0 && <Section title="Cuotas">
        {obligations.monthlyPayments.items.map(fee => <Row key={fee.id} amount={fee.amount}
          concept={isAdmin
            ? <Link to="/payments" className={linkClass}>{formatMonth(fee.month)} {fee.year}</Link>
            : <span className="block truncate text-[#0c1a12]">{formatMonth(fee.month)} {fee.year}</span>} />)}
      </Section>}

      {obligations.loans.count > 0 && <Section title="Préstamos (capital)">
        {obligations.loans.items.map(loan => <Row key={loan.id} amount={loan.outstandingPrincipal}
          concept={<Link to={loanPath(loan.id)} className={linkClass}>Préstamo del {formatDateOnly(loan.startDate)}</Link>}
          secondary={`Prestado ${formatCurrency(loan.initialAmount)}`} />)}
      </Section>}

      {obligations.interests.count > 0 && <Section title="Intereses">
        {obligations.interests.items.map(interest => <Row key={interest.id} amount={interest.amount}
          concept={<Link to={interestPath(interest.loanId, interest.id)} className={linkClass}>Interés del {formatTimestamp(interest.createdAt)}</Link>} />)}
      </Section>}

      {obligations.activitySales.count > 0 && <Section title="Ventas de actividades">
        {obligations.activitySales.items.map(sale => <Row key={sale.id} amount={sale.amount}
          concept={<Link to={assignmentPath(sale.activityId, sale.id)} className={linkClass}>{sale.activityName}</Link>}
          secondary={`${sale.quantity} × ${formatCurrency(sale.salePrice)}`} />)}
      </Section>}
    </>}
  </>
}
