import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getMemberDetail, type MemberDetail } from '@/features/members/api/membersApi'
import { typeBackground, typeColor, typeLabel } from '@/features/transactions/model/labels'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'

const roleLabel: Record<string, string> = { Admin: 'Administrador', Member: 'Miembro' }
const paymentStatus: Record<string, string> = { Pending: 'pending', Paid: 'paid', Cancelled: 'cancelled' }
const card = { background: '#fff', border: '1px solid #d6e8dc' }
const money = (value: number) => `${value < 0 ? '−' : ''}${formatCurrency(value)}`
const cell = (label: string, value: string) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><p className="text-sm text-[#0c1a12] break-words">{value}</p></div>

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !id) return
    const load = async () => {
      try { setDetail(await getMemberDetail(session.accessToken, id)) }
      catch (requestError) {
        setError(requestError instanceof ApiError && requestError.status === 404 ? 'No se encontró el miembro solicitado.' : getFriendlyApiError(requestError))
      }
    }
    void load()
  }, [id, session])

  if (error) return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/members')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!detail) return <div className="p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const { member, balance, pendingPayments, transactions } = detail
  const fields: [string, string][] = [
    ['Nombre', `${member.firstName} ${member.lastName}`], ['Correo', member.email], ['Teléfono', member.phone], ['Rol', roleLabel[member.role] ?? member.role],
    ['Fecha de alta', new Date(member.createdAt).toLocaleString('es-CO')], ['Última actualización', member.updatedAt ? new Date(member.updatedAt).toLocaleString('es-CO') : '—'],
  ]
  const balances: [string, number, boolean][] = [
    ['Ahorrado', balance.savings, false], ['Ganancia en actividades', balance.activityEarnings, false],
    ['Ganancia en rendimientos', balance.performanceEarnings, false], ['Total', balance.total, true],
  ]
  const header = (headings: string[], rightIndexes: number[]) => <thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{headings.map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${rightIndexes.includes(index) ? 'text-right' : 'text-left'}`}>{heading}</th>)}</tr></thead>

  return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/members')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a miembros</button><div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de miembro</h1><p className="text-[#4e7460] text-sm">Información, balance y movimientos del miembro</p></div>
    <div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{fields.map(([label, value]) => cell(label, value))}<div className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">Estado</p><Badge status={member.isActive ? 'active' : 'cancelled'} /></div></div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-6">{balances.map(([label, value, highlight]) => <div key={label} className="stat-card rounded-xl p-4" style={highlight ? { border: '1px solid #0c5c38' } : undefined}><p className="text-[#4e7460] text-xs mb-3">{label}</p><p className={`text-xl font-bold mono ${highlight ? 'text-[#0a6635]' : 'text-[#0c1a12]'}`}>{money(value)}</p></div>)}</div>
    <h2 className="text-sm font-bold text-[#0c1a12] mt-6 mb-3">Pagos pendientes</h2>
    <div className="rounded-xl overflow-hidden" style={card}><div className="overflow-x-auto"><table className="w-full text-sm">{header(['Período', 'Monto', 'Estado', 'Fecha de registro'], [])}<tbody>
      {pendingPayments.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-[#4e7460]">Este miembro no tiene pagos pendientes</td></tr>}
      {pendingPayments.map(payment => <tr key={payment.id} className="table-row"><td className="px-5 py-3.5 text-[#0c1a12] capitalize">{formatMonth(payment.month)} {payment.year}</td><td className="px-4 py-3.5 text-[#0c1a12] mono">{formatCurrency(payment.amount)}</td><td className="px-4 py-3.5"><Badge status={paymentStatus[payment.status] ?? payment.status} /></td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(payment.createdAt).toLocaleDateString('es-CO')}</td></tr>)}
    </tbody></table></div></div>
    <h2 className="text-sm font-bold text-[#0c1a12] mt-6 mb-3">Transacciones</h2>
    <div className="rounded-xl overflow-hidden" style={card}><div className="overflow-x-auto"><table className="w-full text-sm">{header(['Fecha', 'Descripción', 'Tipo', 'Dirección', 'Valor', 'Acciones'], [4, 5])}<tbody>
      {transactions.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">Este miembro no tiene transacciones registradas</td></tr>}
      {transactions.map(transaction => <tr key={transaction.id} className="table-row"><td className="px-5 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(transaction.occurredAt).toLocaleDateString('es-CO')}</td><td className="px-4 py-3.5 text-[#0c1a12] max-w-[220px] truncate">{transaction.description}</td><td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: typeBackground[transaction.type], color: typeColor[transaction.type] }}>{typeLabel[transaction.type]}</span></td><td className="px-4 py-3.5"><Badge status={transaction.direction === 'Income' ? 'income' : 'expense'} /></td><td className={`px-5 py-3.5 text-right mono font-semibold text-sm ${transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.direction === 'Expense' ? '−' : '+'}{formatCurrency(transaction.amount)}</td><td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1"><button onClick={() => navigate(`/transactions/${transaction.id}`)} className="btn-ghost p-1.5 rounded-md" aria-label="Ver detalle"><Icon.Eye open /></button></div></td></tr>)}
    </tbody></table></div></div>
  </div>
}
