import type { Transaction } from '@/shared/model/types'
import { transactions } from '@/shared/data/mockData'
import { formatCurrency, formatShortCurrency } from '@/shared/lib/formatters'
import { Icon } from '@/shared/ui/Icon'

const txTypeColor: Record<Transaction['type'], string> = {
  deposit: '#0a6635', withdrawal: '#c0392b', loan: '#c0392b', interest: '#0074b3', fee: '#9a6e00',
}
const txTypeBg: Record<Transaction['type'], string> = {
  deposit: '#dcf5e8', withdrawal: '#fde8e4', loan: '#fde8e4', interest: '#ddf0ff', fee: '#fef6dc',
}
const txTypeLabel: Record<Transaction['type'], string> = {
  deposit: 'Depósito', withdrawal: 'Retiro', loan: 'Préstamo', interest: 'Interés', fee: 'Multa',
}

export function DashboardPage() {
  const stats = [
    { label: 'Total en la natillera', value: 4_820_000, delta: '+$50K este mes', up: true },
    { label: 'Dinero prestado', value: 720_000, delta: '2 préstamos activos', up: false },
    { label: 'Mis ahorros', value: 550_000, delta: '11 cuotas pagadas', up: true },
    { label: 'Mis ganancias', value: 42_500, delta: 'Intereses acumulados', up: true },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-7"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Buen día, Ana</h1><p className="text-[#4e7460] text-sm">Septiembre 2026</p></div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-7">
        {stats.map(({ label, value, delta, up }, index) => (
          <div key={label} className={`stat-card rounded-xl p-4 fade-up-${Math.min(index + 1, 4)}`}>
            <p className="text-[#4e7460] text-xs mb-3">{label}</p>
            <p className="text-xl font-bold text-[#0c1a12] mono mb-2">{formatShortCurrency(value)}</p>
            <p className={`text-xs flex items-center gap-1 font-medium ${up ? 'text-[#0a6635]' : 'text-[#c0392b]'}`}>{up ? <Icon.ArrowUp /> : <Icon.ArrowDown />}{delta}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: '#eef4f0' }}>
          <h2 className="font-semibold text-[#0c1a12] text-sm">Movimientos recientes</h2>
          <span className="text-xs text-[#4e7460] mono">{transactions.slice(0, 8).length} registros</span>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
            {['Fecha', 'Descripción', 'Miembro', 'Tipo', 'Valor'].map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${index === 4 ? 'text-right' : 'text-left'} ${index === 2 ? 'hidden md:table-cell' : ''}`}>{heading}</th>)}
          </tr></thead>
          <tbody>{transactions.slice(0, 8).map(transaction => <tr key={transaction.id} className="table-row">
            <td className="px-5 py-3 text-[#4e7460] mono text-xs whitespace-nowrap">{transaction.date}</td>
            <td className="px-4 py-3 text-[#0c1a12] max-w-[180px] truncate">{transaction.description}</td>
            <td className="px-4 py-3 text-[#4e7460] text-sm hidden md:table-cell">{transaction.member}</td>
            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: txTypeBg[transaction.type], color: txTypeColor[transaction.type] }}>{txTypeLabel[transaction.type]}</span></td>
            <td className={`px-5 py-3 text-right mono font-semibold text-sm ${transaction.amount < 0 ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.amount < 0 ? '−' : '+'}{formatCurrency(transaction.amount)}</td>
          </tr>)}</tbody>
        </table></div>
      </div>
    </div>
  )
}
