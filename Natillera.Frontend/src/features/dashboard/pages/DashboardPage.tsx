import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { getDashboardSummary, type DashboardSummary } from '@/features/dashboard/api/dashboardApi'
import { PendingObligationsCard } from '@/features/members/components/PendingObligationsCard'
import { hasPendingObligations } from '@/features/members/model/pendingObligations'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { cell, cellAmount, cellFirst, cellLast, tableScroll } from '@/shared/ui/tableStyles'

const signed = (amount: number) => `${amount < 0 ? '−' : '+'}${formatCurrency(Math.abs(amount))}`
const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CO')

export function DashboardPage() {
  const { session } = useAuth()
  const { selected } = useSavingPeriod()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    const load = async () => {
      try { setSummary(await getDashboardSummary(session.accessToken)) }
      catch (requestError) { setError(getFriendlyApiError(requestError)) }
      finally { setLoading(false) }
    }
    void load()
  }, [session])

  const isAdmin = session?.user.role === 'Admin'
  const available = summary?.availableMoney ?? 0
  const sellers = summary?.topSellers ?? []
  const maxEarnings = Math.max(...sellers.map(seller => seller.earnings), 0)
  const transactions = (summary?.recentTransactions ?? []).slice(0, 5)
  const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
  const rowClass = 'flex justify-between border-t border-[#eef4f0] pt-2'

  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
    <div className="mb-7">
      <h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">{isAdmin ? 'Resumen de la natillera' : 'Mi resumen'}</h1>
      <p className="text-[#4e7460] text-sm">{isAdmin ? 'Cuánto dinero hay y cómo se mueve' : 'Cuánto hay en la natillera y cuánto llevas ahorrado'}{selected ? ` · Periodo ${selected.year}` : ''}</p>
    </div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
    {!isAdmin && !loading && summary?.pendingObligations && hasPendingObligations(summary.pendingObligations) && <section aria-labelledby="dashboard-pending-title" className="mb-4 rounded-xl border border-[#f3dc9a] bg-[#fef6dc] p-5">
      <PendingObligationsCard obligations={summary.pendingObligations} audience="member" titleId="dashboard-pending-title" />
    </section>}
    {!error && <div className="flex flex-col gap-4 lg:gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section aria-labelledby="available-title" aria-busy={loading} className="rounded-xl p-5 lg:p-6 text-white lg:col-span-3" style={{ background: '#0c5c38' }}>
          <h2 id="available-title" className="text-sm font-medium text-[#cfe8da]">Dinero disponible</h2>
          <p className="mono font-bold text-3xl md:text-4xl mt-2 break-words">
            {loading ? '—' : available < 0 ? `−${formatCurrency(Math.abs(available))}` : formatCurrency(available)}
          </p>
          <p className="text-sm text-[#cfe8da] mt-2">Lo que hay hoy en caja para prestar o invertir. No incluye lo prestado ni lo invertido en actividades.</p>
          {isAdmin && !loading && <div className="border-t border-white/20 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-xs text-[#cfe8da]">Prestado (por recuperar)</p><p className="mono text-base font-semibold text-white">{formatCurrency(summary?.lentMoney ?? 0)}</p></div>
            <div><p className="text-xs text-[#cfe8da]">En actividades (por cobrar)</p><p className="mono text-base font-semibold text-white">{formatCurrency(summary?.pendingActivitiesInvestment ?? 0)}</p></div>
          </div>}
        </section>
        <section aria-labelledby="savings-title" aria-busy={loading} className="stat-card rounded-xl p-5 lg:col-span-2" style={{ border: '1px solid #0c5c38' }}>
          {isAdmin ? <>
            <h2 id="savings-title" className="text-sm font-semibold text-[#0c1a12]">Rendimiento de la natillera</h2>
            <p className="mono text-2xl font-bold text-[#0a6635] mt-2 break-words">{loading ? '—' : formatCurrency(summary?.totalNatilleraBalance ?? 0)}</p>
            <p className="text-xs text-[#4e7460]">Dinero total de la natillera</p>
            <p className="text-xs text-[#4e7460]">Disponible + prestado + actividades</p>
            {!loading && <dl className="mt-4 space-y-2 text-sm">
              <div className={rowClass}><dt><span className="text-[#0c1a12]">Rendimientos de préstamos</span><span className="block text-xs text-[#4e7460]">Intereses pagados</span></dt><dd className="mono text-[#0a6635]">{formatCurrency(summary?.loanInterestEarned ?? 0)}</dd></div>
              <div className={rowClass}><dt><span className="text-[#0c1a12]">Ganancias de actividades</span><span className="block text-xs text-[#4e7460]">Ventas pagadas</span></dt><dd className="mono text-[#0a6635]">{formatCurrency(summary?.activityEarnings ?? 0)}</dd></div>
            </dl>}
          </> : <>
            <h2 id="savings-title" className="text-sm font-semibold text-[#0c1a12]">Mis ahorros</h2>
            <p className="mono text-2xl font-bold text-[#0a6635] mt-2 break-words">{loading ? '—' : formatCurrency(summary?.mySavings ?? 0)}</p>
            <p className="text-xs text-[#4e7460]">Lo que has aportado más lo que has ganado</p>
            {!loading && <>
              <dl className="mt-4 space-y-2 text-sm">
                <div className={rowClass}><dt className="text-[#0c1a12]">Cuotas pagadas</dt><dd className="mono text-[#0c1a12]">{formatCurrency(summary?.myPaidMonthlyPayments ?? 0)}</dd></div>
                <div className={rowClass}><dt><span className="text-[#0c1a12]">Ganancia en actividades</span><span className="block text-xs text-[#4e7460]">Ventas de actividades</span></dt><dd className="mono text-[#0a6635]">{formatCurrency(summary?.myActivityEarnings ?? 0)}</dd></div>
                <div className={rowClass}><dt><span className="text-[#0c1a12]">Rendimientos</span><span className="block text-xs text-[#4e7460]">Tu parte de los intereses de préstamos</span></dt><dd className="mono text-[#0a6635]">{formatCurrency(summary?.myPerformanceShare ?? 0)}</dd></div>
              </dl>
              {(summary?.mySavings ?? 0) === 0 && <p className="mt-3 text-xs text-[#4e7460]">Aún no tienes cuotas pagadas.</p>}
            </>}
          </>}
        </section>
      </div>

      <section aria-labelledby="ranking-title" aria-busy={loading} className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: '#eef4f0' }}>
          <h2 id="ranking-title" className="font-semibold text-[#0c1a12] text-sm">Top 10 de ventas</h2>
          <p className="text-xs text-[#4e7460]">Ganancia de cada miembro en ventas pagadas</p>
        </div>
        {loading ? <p className="px-5 py-10 text-center text-sm text-[#4e7460]">Cargando ranking...</p>
          : sellers.length === 0 ? <p className="px-5 py-10 text-center text-sm text-[#4e7460]">Todavía no hay ventas pagadas. Cuando se registre el pago de una venta, aparecerá aquí.</p>
          : <ol className="divide-y divide-[#eef4f0]">{sellers.map((seller, index) => <li key={seller.userId} className="flex items-center gap-3 px-5 py-3 min-h-[56px]">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mono text-sm font-bold flex-shrink-0 ${index < 3 ? 'bg-[#0c5c38] text-white' : 'bg-[#eef4f0] text-[#4e7460]'}`}><span className="sr-only">Puesto </span>{index + 1}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-[#0c1a12] truncate ${index < 3 ? 'font-semibold' : ''}`}>{seller.memberName}</p>
              <p className="text-xs text-[#4e7460]">{`${seller.unitsSold} unidades · Recaudado ${formatCurrency(seller.collectedAmount)}`}</p>
              <div aria-hidden="true" className="h-1 rounded bg-[#eef4f0] mt-1.5"><div className="h-1 rounded bg-[#0c5c38]" style={{ width: `${maxEarnings > 0 ? Math.max(0, Math.min(100, (seller.earnings / maxEarnings) * 100)) : 0}%` }} /></div>
            </div>
            <p className="mono text-sm font-semibold text-[#0a6635] text-right whitespace-nowrap">{formatCurrency(seller.earnings)}</p>
          </li>)}</ol>}
      </section>

      <section aria-labelledby="recent-title" aria-busy={loading} className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: '#eef4f0' }}>
          <h2 id="recent-title" className="text-sm font-semibold text-[#4e7460]">Movimientos recientes</h2>
          <Link to="/transactions" aria-label="Ver todos los movimientos" className="inline-flex items-center min-h-10 px-2 text-sm whitespace-nowrap shrink-0 text-[#0a6635] underline rounded focus-visible:outline-2 focus-visible:outline-[#0c5c38]"><span className="sm:hidden" aria-hidden="true">Ver todos</span><span className="hidden sm:inline" aria-hidden="true">Ver todos los movimientos</span></Link>
        </div>
        {loading ? <p className="px-5 py-10 text-center text-sm text-[#4e7460]">Cargando movimientos...</p>
          : transactions.length === 0 ? <p className="px-5 py-10 text-center text-sm text-[#4e7460]">Aún no hay movimientos registrados</p>
          : <div className={tableScroll}><table className="w-full text-sm"><tbody>{transactions.map(transaction => <tr key={transaction.id} className="table-row">
            <td className={`${cellFirst} py-2.5 mono text-xs text-[#4e7460] whitespace-nowrap hidden sm:table-cell`}>{formatDate(transaction.occurredAt)}</td>
            <td className={`${cell} sm:px-4 py-2.5 w-full sm:w-auto max-w-0 sm:max-w-none`}><Link to={`/transactions/${transaction.id}`} className="block text-[#0c1a12] truncate sm:max-w-[260px] hover:underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">{transaction.description}</Link><p className="text-xs text-[#4e7460] truncate"><span className="sm:hidden">{formatDate(transaction.occurredAt)}{transaction.memberName ? ' · ' : ''}</span>{transaction.memberName}</p></td>
            <td className={`${cellLast} py-2.5 ${cellAmount} font-semibold ${transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{signed(transaction.direction === 'Expense' ? -transaction.amount : transaction.amount)}</td>
          </tr>)}</tbody></table></div>}
      </section>
    </div>}
  </div>
}
