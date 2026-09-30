import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getDashboardSummary, type DashboardSummary, type DashboardTransactionType } from '@/features/dashboard/api/dashboardApi'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatShortCurrency } from '@/shared/lib/formatters'

const typeLabel: Record<DashboardTransactionType, string> = { MonthlyPayment: 'Cuota mensual', Activity: 'Actividad', ActivitySale: 'Venta', Loan: 'Préstamo', LoanPayment: 'Pago préstamo', Performance: 'Rendimiento' }
const typeColor: Record<DashboardTransactionType, string> = { MonthlyPayment: '#0a6635', Activity: '#9a6e00', ActivitySale: '#0074b3', Loan: '#c0392b', LoanPayment: '#0a6635', Performance: '#0074b3' }
const typeBackground: Record<DashboardTransactionType, string> = { MonthlyPayment: '#dcf5e8', Activity: '#fef6dc', ActivitySale: '#ddf0ff', Loan: '#fde8e4', LoanPayment: '#dcf5e8', Performance: '#ddf0ff' }

export function DashboardPage() {
  const { session } = useAuth()
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
  const metrics = isAdmin ? [
    { label: 'Saldo total', value: summary?.totalNatilleraBalance ?? null, detail: 'Disponible + préstamos + actividades' },
    { label: 'Dinero disponible', value: summary?.availableMoney ?? null, detail: 'Saldo disponible actual' },
    { label: 'Dinero prestado', value: summary?.lentMoney ?? null, detail: 'Capital pendiente por recuperar' },
    { label: 'Invertido en actividades', value: summary?.pendingActivitiesInvestment ?? null, detail: 'Asignaciones pendientes' },
  ] : [
    { label: 'Saldo disponible', value: summary?.availableMoney ?? null, detail: 'Saldo actual de la natillera' },
    { label: 'Mis ahorros', value: summary?.mySavings ?? null, detail: 'Balance neto de mis operaciones' },
    { label: 'Mis ganancias', value: summary?.myEarnings ?? null, detail: 'Rendimientos pagados' },
    { label: 'Pagos pendientes', value: summary?.pendingPayments ?? null, detail: 'Cuotas del período actual' },
  ]

  return <div className="p-6 lg:p-8 max-w-5xl">
    <div className="mb-7"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">{isAdmin ? 'Resumen de la natillera' : 'Mi resumen'}</h1><p className="text-[#4e7460] text-sm">{isAdmin ? 'Métricas globales y movimientos reales' : 'Tu información financiera y movimientos visibles'}</p></div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-7">{loading ? [1, 2, 3, 4].map(index => <div key={index} className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-3">Cargando...</p><p className="text-xl font-bold text-[#0c1a12] mono">—</p></div>) : metrics.map(metric => <div key={metric.label} className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-3">{metric.label}</p><p className="text-xl font-bold text-[#0c1a12] mono mb-2">{metric.label === 'Pagos pendientes' ? metric.value : formatShortCurrency(metric.value ?? 0)}</p><p className="text-xs text-[#4e7460]">{metric.detail}</p></div>)}</div>
    <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}><div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: '#eef4f0' }}><h2 className="font-semibold text-[#0c1a12] text-sm">Movimientos recientes</h2><span className="text-xs text-[#4e7460] mono">{summary?.recentTransactions.length ?? 0} registros</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{['Fecha', 'Descripción', 'Miembro', 'Tipo', 'Valor'].map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${index === 4 ? 'text-right' : 'text-left'} ${index === 2 ? 'hidden md:table-cell' : ''}`}>{heading}</th>)}</tr></thead><tbody>{!loading && (summary?.recentTransactions.length ?? 0) === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[#4e7460]">No hay movimientos registrados</td></tr>}{summary?.recentTransactions.map(transaction => <tr key={transaction.id} className="table-row"><td className="px-5 py-3 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(transaction.occurredAt).toLocaleDateString('es-CO')}</td><td className="px-4 py-3 text-[#0c1a12] max-w-[180px] truncate">{transaction.description}</td><td className="px-4 py-3 text-[#4e7460] text-sm hidden md:table-cell">{transaction.memberName ?? '—'}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: typeBackground[transaction.type], color: typeColor[transaction.type] }}>{typeLabel[transaction.type]}</span></td><td className={`px-5 py-3 text-right mono font-semibold text-sm ${transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.direction === 'Expense' ? '−' : '+'}{formatCurrency(transaction.amount)}</td></tr>)}</tbody></table></div></div>
  </div>
}
