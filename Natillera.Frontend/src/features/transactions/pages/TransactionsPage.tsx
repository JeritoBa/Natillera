import { Icon } from '@/shared/ui/Icon'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { getTransactions, type RealTransaction, type TransactionType } from '@/features/transactions/api/transactionsApi'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatShortCurrency } from '@/shared/lib/formatters'

const typeLabel: Record<TransactionType, string> = {
  MonthlyPayment: 'Cuota mensual', Activity: 'Actividad', ActivitySale: 'Venta', Loan: 'Préstamo', LoanPayment: 'Pago préstamo', Performance: 'Rendimiento',
}
const typeColor: Record<TransactionType, string> = {
  MonthlyPayment: '#0a6635', Activity: '#9a6e00', ActivitySale: '#0074b3', Loan: '#c0392b', LoanPayment: '#0a6635', Performance: '#0074b3',
}
const typeBackground: Record<TransactionType, string> = {
  MonthlyPayment: '#dcf5e8', Activity: '#fef6dc', ActivitySale: '#ddf0ff', Loan: '#fde8e4', LoanPayment: '#dcf5e8', Performance: '#ddf0ff',
}

export function TransactionsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<RealTransaction[]>([])
  const [filter, setFilter] = useState<TransactionType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    const load = async () => {
      try { setTransactions(await getTransactions(session.accessToken)) }
      catch (requestError) { setError(getFriendlyApiError(requestError)) }
      finally { setLoading(false) }
    }
    void load()
  }, [session])

  const filtered = filter === 'all' ? transactions : transactions.filter(transaction => transaction.type === filter)
  const income = transactions.filter(transaction => transaction.direction === 'Income').reduce((total, transaction) => total + transaction.amount, 0)
  const expense = transactions.filter(transaction => transaction.direction === 'Expense').reduce((total, transaction) => total + transaction.amount, 0)
  const filters: (TransactionType | 'all')[] = ['all', 'MonthlyPayment', 'Loan', 'LoanPayment', 'Performance', 'Activity', 'ActivitySale']

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Transacciones</h1><p className="text-[#4e7460] text-sm">Historial real de movimientos</p></div>
      <div className="grid grid-cols-3 gap-3 mb-5"><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Ingresos totales</p><p className="text-lg font-bold mono text-[#0a6635]">{formatShortCurrency(income)}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Egresos totales</p><p className="text-lg font-bold mono text-[#c0392b]">{formatShortCurrency(expense)}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Movimientos</p><p className="text-lg font-bold mono text-[#0c1a12]">{transactions.length}</p></div></div>
      <div className="flex gap-1.5 flex-wrap mb-4">{filters.map(value => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === value ? 'bg-[#0c5c38] text-white' : 'btn-ghost'}`}>{value === 'all' ? 'Todos' : typeLabel[value]}</button>)}</div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{['Fecha', 'Descripción', 'Miembro', 'Tipo', 'Valor', 'Acciones'].map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${index >= 4 ? 'text-right' : 'text-left'} ${index === 2 ? 'hidden md:table-cell' : ''}`}>{heading}</th>)}</tr></thead><tbody>
        {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">Cargando transacciones...</td></tr>}
        {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">No hay transacciones registradas</td></tr>}
        {!loading && filtered.map(transaction => <tr key={transaction.id} className="table-row"><td className="px-5 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(transaction.occurredAt).toLocaleDateString('es-CO')}</td><td className="px-4 py-3.5 text-[#0c1a12] max-w-[220px] truncate">{transaction.description}</td><td className="px-4 py-3.5 text-[#4e7460] hidden md:table-cell">{transaction.memberName ?? '—'}</td><td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: typeBackground[transaction.type], color: typeColor[transaction.type] }}>{typeLabel[transaction.type]}</span></td><td className={`px-5 py-3.5 text-right mono font-semibold text-sm ${transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.direction === 'Expense' ? '−' : '+'}{formatCurrency(transaction.amount)}</td><td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1"><button onClick={() => navigate(`/transactions/${transaction.id}`)} className="btn-ghost p-1.5 rounded-md" aria-label="Ver detalle"><Icon.Eye open /></button></div></td></tr>)}
      </tbody></table></div></div>
    </div>
  )
}
