import { useState } from 'react'
import type { Activity, Loan, Payment, Transaction } from '@/shared/model/types'
import { activities, loans, payments, transactions } from '@/shared/data/mockData'
import { formatCurrency, formatShortCurrency } from '@/shared/lib/formatters'
import { CrudPage, type CrudConfig } from '@/shared/components/CrudPage'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'

export function LoansPage() {
  const config: CrudConfig<Loan> = {
    title: 'Préstamos', subtitle: 'Gestiona los créditos internos de la natillera',
    summaryStats: [{ label: 'Capital prestado', value: formatShortCurrency(720_000) }, { label: 'Préstamos activos', value: '2' }, { label: 'Vencidos', value: '1' }],
    emptyItem: { member: '', amount: 0, balance: 0, rate: 2, startDate: '', dueDate: '', status: 'active' },
    formFields: [
      { name: 'member', label: 'Miembro', type: 'text' }, { name: 'amount', label: 'Monto ($)', type: 'number' }, { name: 'balance', label: 'Saldo pendiente ($)', type: 'number' },
      { name: 'rate', label: 'Tasa mensual (%)', type: 'number' }, { name: 'startDate', label: 'Fecha inicio', type: 'date' }, { name: 'dueDate', label: 'Fecha vencimiento', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'paid', 'overdue'] },
    ],
    columns: [
      { label: 'Miembro', render: row => <span className="font-medium text-[#0c1a12]">{row.member}</span> },
      { label: 'Monto', render: row => <span className="mono text-[#0c1a12]">{formatCurrency(row.amount)}</span>, align: 'right' },
      { label: 'Saldo', render: row => <span className={`mono font-semibold ${row.balance > 0 ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{formatCurrency(row.balance)}</span>, align: 'right' },
      { label: 'Tasa', render: row => <span className="mono text-[#4e7460]">{row.rate}%</span> },
      { label: 'Vence', render: row => <span className="text-[#4e7460] mono text-xs">{row.dueDate}</span> },
      { label: 'Estado', render: row => <Badge status={row.status} /> },
    ],
  }
  return <CrudPage data={loans} config={config} />
}

export function ActivitiesPage() {
  const config: CrudConfig<Activity> = {
    title: 'Actividades', subtitle: 'Eventos, reuniones y acuerdos de la natillera',
    emptyItem: { date: '', description: '', type: 'Reunión', amount: 0, status: 'pending' },
    formFields: [
      { name: 'date', label: 'Fecha', type: 'date' }, { name: 'description', label: 'Descripción', type: 'text' },
      { name: 'type', label: 'Tipo', type: 'select', options: ['Reunión', 'Aprobación', 'Distribución', 'Administrativa'] },
      { name: 'amount', label: 'Monto asociado ($)', type: 'number' }, { name: 'status', label: 'Estado', type: 'select', options: ['pending', 'completed', 'cancelled'] },
    ],
    columns: [
      { label: 'Fecha', render: row => <span className="text-[#4e7460] mono text-xs">{row.date}</span> },
      { label: 'Descripción', render: row => <span className="text-[#0c1a12]">{row.description}</span> },
      { label: 'Tipo', render: row => <span className="badge-neutral px-2 py-0.5 rounded uppercase">{row.type}</span> },
      { label: 'Monto', render: row => <span className="mono text-[#4e7460]">{row.amount > 0 ? formatCurrency(row.amount) : '—'}</span>, align: 'right' },
      { label: 'Estado', render: row => <Badge status={row.status} /> },
    ],
  }
  return <CrudPage data={activities} config={config} />
}

export function PaymentsPage() {
  const paid = payments.filter(payment => payment.status === 'paid')
  const config: CrudConfig<Payment> = {
    title: 'Cuotas Mensuales', subtitle: 'Aportes de cada miembro · Septiembre 2026',
    summaryStats: [{ label: 'Recaudado', value: formatShortCurrency(paid.reduce((total, payment) => total + payment.amount, 0)) }, { label: 'Pagaron', value: `${paid.length} de ${payments.length}` }, { label: 'Vencidos', value: String(payments.filter(payment => payment.status === 'overdue').length) }],
    emptyItem: { member: '', month: 'Sep 2026', amount: 50000, paidDate: null, status: 'pending' },
    formFields: [
      { name: 'member', label: 'Miembro', type: 'text' }, { name: 'month', label: 'Mes', type: 'text' }, { name: 'amount', label: 'Monto ($)', type: 'number' },
      { name: 'paidDate', label: 'Fecha de pago', type: 'date' }, { name: 'status', label: 'Estado', type: 'select', options: ['paid', 'pending', 'overdue'] },
    ],
    columns: [
      { label: 'Miembro', render: row => <span className="font-medium text-[#0c1a12]">{row.member}</span> },
      { label: 'Mes', render: row => <span className="text-[#4e7460] mono text-xs">{row.month}</span> },
      { label: 'Monto', render: row => <span className="mono text-[#0c1a12]">{formatCurrency(row.amount)}</span>, align: 'right' },
      { label: 'Fecha pago', render: row => <span className="text-[#4e7460] mono text-xs">{row.paidDate ?? '—'}</span> },
      { label: 'Estado', render: row => <div className="flex items-center gap-1.5"><Badge status={row.status} />{row.status === 'paid' && <span className="text-[#0a6635]"><Icon.Check /></span>}</div> },
    ],
  }
  return <CrudPage data={payments} config={config} />
}

export function TransactionsPage() {
  const [filter, setFilter] = useState<Transaction['type'] | 'all'>('all')
  const txTypeColor: Record<Transaction['type'], string> = { deposit: '#0a6635', withdrawal: '#c0392b', loan: '#c0392b', interest: '#0074b3', fee: '#9a6e00' }
  const txTypeBg: Record<Transaction['type'], string> = { deposit: '#dcf5e8', withdrawal: '#fde8e4', loan: '#fde8e4', interest: '#ddf0ff', fee: '#fef6dc' }
  const txTypeLabel: Record<Transaction['type'], string> = { deposit: 'Depósito', withdrawal: 'Retiro', loan: 'Préstamo', interest: 'Interés', fee: 'Multa' }
  const filters: (Transaction['type'] | 'all')[] = ['all', 'deposit', 'withdrawal', 'loan', 'interest', 'fee']
  const filterLabel = { all: 'Todos', ...txTypeLabel }
  const filtered = filter === 'all' ? transactions : transactions.filter(transaction => transaction.type === filter)
  const income = transactions.filter(transaction => transaction.amount > 0).reduce((total, transaction) => total + transaction.amount, 0)
  const expense = transactions.filter(transaction => transaction.amount < 0).reduce((total, transaction) => total + Math.abs(transaction.amount), 0)

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Transacciones</h1><p className="text-[#4e7460] text-sm">Historial completo de movimientos</p></div>
      <div className="grid grid-cols-3 gap-3 mb-5"><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Ingresos totales</p><p className="text-lg font-bold mono text-[#0a6635]">{formatShortCurrency(income)}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Egresos totales</p><p className="text-lg font-bold mono text-[#c0392b]">{formatShortCurrency(expense)}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Movimientos</p><p className="text-lg font-bold mono text-[#0c1a12]">{transactions.length}</p></div></div>
      <div className="flex gap-1.5 flex-wrap mb-4">{filters.map(value => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === value ? 'bg-[#0c5c38] text-white' : 'btn-ghost'}`}>{filterLabel[value]}</button>)}</div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{['Fecha', 'Descripción', 'Miembro', 'Tipo', 'Valor'].map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${index === 4 ? 'text-right' : 'text-left'} ${index === 2 ? 'hidden md:table-cell' : ''}`}>{heading}</th>)}</tr></thead><tbody>{filtered.map(transaction => <tr key={transaction.id} className="table-row"><td className="px-5 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{transaction.date}</td><td className="px-4 py-3.5 text-[#0c1a12] max-w-[200px] truncate">{transaction.description}</td><td className="px-4 py-3.5 text-[#4e7460] hidden md:table-cell">{transaction.member}</td><td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: txTypeBg[transaction.type], color: txTypeColor[transaction.type] }}>{txTypeLabel[transaction.type]}</span></td><td className={`px-5 py-3.5 text-right mono font-semibold text-sm ${transaction.amount < 0 ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.amount < 0 ? '−' : '+'}{formatCurrency(transaction.amount)}</td></tr>)}</tbody></table></div></div>
    </div>
  )
}
