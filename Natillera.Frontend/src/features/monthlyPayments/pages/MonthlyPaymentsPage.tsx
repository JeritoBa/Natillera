import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMembers } from '@/features/members/hooks/useMembers'
import { createMonthlyPayment, getPaidMonthlyPayments, updateMonthlyPayment } from '@/features/monthlyPayments/api/monthlyPaymentsApi'
import type { Payment } from '@/shared/model/types'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatShortCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
type MonthlyPaymentRow = Payment & { backendId: string; userId: string; year: number; monthNumber: number }

export function MonthlyPaymentsPage() {
  const { session } = useAuth()
  const { members, loading: membersLoading } = useMembers()
  const [payments, setPayments] = useState<MonthlyPaymentRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MonthlyPaymentRow | null>(null)
  const [memberId, setMemberId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const activeMembers = members.filter(member => member.isActive)
  const paid = payments.filter(payment => payment.status === 'paid')

  useEffect(() => {
    if (!session) return
    const load = async () => {
      try {
        const response = await getPaidMonthlyPayments(session.accessToken)
        setPayments(response.map((payment, index) => ({ id: index + 1, backendId: payment.id, userId: payment.userId, year: payment.year, monthNumber: payment.month, member: payment.memberName, month: `${monthNames[payment.month - 1].slice(0, 3)} ${payment.year}`, amount: payment.amount, paidDate: payment.paidAt.slice(0, 10), status: 'paid' })))
      } catch (requestError) { setError(getFriendlyApiError(requestError)) }
    }
    void load()
  }, [session])

  const openCreate = () => {
    setEditing(null); setMemberId(activeMembers[0]?.id ?? ''); setMonth(new Date().getMonth() + 1); setYear(new Date().getFullYear()); setAmount(''); setError(null); setSuccess(null); setModalOpen(true)
  }

  const openEdit = (payment: MonthlyPaymentRow) => {
    setEditing(payment); setMemberId(payment.userId); setMonth(payment.monthNumber); setYear(payment.year); setAmount(String(payment.amount)); setError(null); setSuccess(null); setModalOpen(true)
  }

  const save = async () => {
    setError(null); setSuccess(null)
    const numericAmount = Number(amount)
    if (!memberId) return setError('Selecciona un miembro.')
    if (!Number.isInteger(year) || year < 1) return setError('Ingresa un año válido.')
    if (!Number.isInteger(month) || month < 1 || month > 12) return setError('Selecciona un mes válido.')
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Ingresa un monto válido.')
    if (!session) return
    setLoading(true)
    try {
      const request = { userId: memberId, year, month, amount: numericAmount }
      const response = editing ? await updateMonthlyPayment(session.accessToken, editing.backendId, request) : await createMonthlyPayment(session.accessToken, request)
      const member = members.find(item => item.id === memberId)
      const updatedRow: MonthlyPaymentRow = { id: editing?.id ?? Number(new Date().getTime()), backendId: response.id, userId: response.userId, year: response.year, monthNumber: response.month, member: member ? `${member.firstName} ${member.lastName}` : response.memberName, month: `${monthNames[response.month - 1].slice(0, 3)} ${response.year}`, amount: response.amount, paidDate: response.paidAt.slice(0, 10), status: 'paid' }
      setPayments(current => editing ? current.map(item => item.id === editing.id ? updatedRow : item) : [updatedRow, ...current])
      setModalOpen(false); setSuccess(editing ? 'La cuota mensual se actualizó correctamente.' : 'La cuota mensual se registró correctamente.')
    } catch (requestError) { setError(getFriendlyApiError(requestError)) }
    finally { setLoading(false) }
  }

  const isAdmin = session?.user.role === 'Admin'
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap"><div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Cuotas Mensuales</h1><p className="text-[#4e7460] text-sm">Aportes de cada miembro · Septiembre 2026</p></div>{isAdmin && <button onClick={openCreate} disabled={membersLoading || activeMembers.length === 0} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-50"><Icon.Plus /> Agregar cuota</button>}</div>
      <div className="grid grid-cols-3 gap-3 mb-5"><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Recaudado</p><p className="text-lg font-bold text-[#0c1a12] mono">{formatShortCurrency(paid.reduce((total, payment) => total + payment.amount, 0))}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Pagaron</p><p className="text-lg font-bold text-[#0c1a12] mono">{paid.length}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Cuotas reales</p><p className="text-lg font-bold text-[#0c1a12] mono">{payments.length}</p></div></div>
      {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}{error && !modalOpen && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{['Miembro', 'Mes', 'Monto', 'Fecha pago', 'Estado', ...(isAdmin ? ['Acciones'] : [])].map(heading => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${heading === 'Monto' ? 'text-right' : 'text-left'}`}>{heading}</th>)}</tr></thead><tbody>{payments.map(payment => <tr key={payment.id} className="table-row"><td className="px-5 py-3.5"><span className="font-medium text-[#0c1a12]">{payment.member}</span></td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs">{payment.month}</td><td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(payment.amount)}</td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs">{payment.paidDate ?? '—'}</td><td className="px-4 py-3.5"><Badge status={payment.status} /></td>{isAdmin && <td className="px-5 py-3.5 text-right"><button onClick={() => openEdit(payment)} className="btn-ghost p-1.5 rounded-md" aria-label="Editar cuota"><Icon.Edit /></button></td>}</tr>)}</tbody></table></div></div>
      {modalOpen && <Modal title={editing ? 'Editar cuota mensual' : 'Nueva cuota mensual'} onClose={() => !loading && setModalOpen(false)}><div className="space-y-4"><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Miembro</label><select value={memberId} onChange={event => setMemberId(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un miembro</option>{members.filter(member => editing ? true : member.isActive).map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Mes</label><select value={month} onChange={event => setMonth(Number(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm">{monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></div><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Año</label><input type="number" min="1" value={year} onChange={event => setYear(Number(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div></div><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto</label><input type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="50000" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>{error && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}<div className="flex gap-3 pt-1"><button onClick={() => setModalOpen(false)} disabled={loading} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} disabled={loading} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{loading ? 'Guardando...' : editing ? 'Actualizar cuota' : 'Guardar cuota'}</button></div></div></Modal>}
    </div>
  )
}
