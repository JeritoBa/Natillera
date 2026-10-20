import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMembers } from '@/features/members/hooks/useMembers'
import { cancelMonthlyPayment, createMonthlyPayment, getMonthlyPayments, updateMonthlyPayment, type MonthlyPaymentResponse } from '@/features/monthlyPayments/api/monthlyPaymentsApi'
import { getAvailableMonths, isValidFeeYear, resolveSelectedMonth } from '@/features/monthlyPayments/model/availableMonths'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth, formatShortCurrency } from '@/shared/lib/formatters'
import { toMoneyInputValue } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'
import { StatusRadioGroup } from '@/shared/ui/StatusRadioGroup'
import { MoneyInput } from '@/shared/ui/MoneyInput'

type MonthlyPaymentRow = {
  backendId: string; userId: string; member: string; year: number; monthNumber: number; month: string; amount: number
  paidDate: string | null; status: 'pending' | 'paid' | 'cancelled'
}

const toRow = (payment: MonthlyPaymentResponse): MonthlyPaymentRow => ({
  backendId: payment.id, userId: payment.userId, member: payment.memberName, year: payment.year, monthNumber: payment.month,
  month: `${formatMonth(payment.month).slice(0, 3)} ${payment.year}`, amount: payment.amount,
  paidDate: payment.paidAt?.slice(0, 10) ?? null, status: payment.status.toLowerCase() as MonthlyPaymentRow['status'],
})

export function MonthlyPaymentsPage() {
  const { session, isDemo } = useAuth()
  const { members, loading: membersLoading } = useMembers()
  const [payments, setPayments] = useState<MonthlyPaymentRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MonthlyPaymentRow | null>(null)
  const [memberId, setMemberId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Paid')
  const [saving, setSaving] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const activeMembers = members.filter(member => member.isActive)
  const paid = payments.filter(payment => payment.status === 'paid')
  const actual = payments.filter(payment => payment.status !== 'cancelled')

  const load = useCallback(async () => {
    if (!session) return
    try { setPayments((await getMonthlyPayments(session.accessToken)).map(toRow)); setListError(null) }
    catch (requestError) { setListError(getFriendlyApiError(requestError)) }
    finally { setListLoading(false) }
  }, [session])

  // MP-10: the Mes select only offers months without a non-cancelled fee for the member and year; the edited fee never blocks itself.
  const feePeriods = useMemo(() => payments.map(payment => ({ id: payment.backendId, userId: payment.userId, year: payment.year, month: payment.monthNumber, cancelled: payment.status === 'cancelled' })), [payments])
  const availableMonths = getAvailableMonths(feePeriods, memberId, year, editing?.backendId)
  const selectedMonth = resolveSelectedMonth(month, availableMonths, new Date())
  const memberOption = members.find(member => member.id === memberId)
  const memberName = memberOption ? `${memberOption.firstName} ${memberOption.lastName}` : ''
  const yearValid = isValidFeeYear(year)

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const openCreate = () => {
    setEditing(null); setMemberId(activeMembers[0]?.id ?? ''); setMonth(new Date().getMonth() + 1); setYear(new Date().getFullYear()); setAmount(''); setStatus('Paid'); setError(null); setModalError(null); setSuccess(null); setModalOpen(true)
  }

  const openEdit = (payment: MonthlyPaymentRow) => {
    setEditing(payment); setMemberId(payment.userId); setMonth(payment.monthNumber); setYear(payment.year); setAmount(toMoneyInputValue(payment.amount)); setStatus(payment.status === 'paid' ? 'Paid' : 'Pending'); setError(null); setModalError(null); setSuccess(null); setModalOpen(true)
  }

  const save = async () => {
    if (saving) return
    setModalError(null); setSuccess(null)
    const numericAmount = Number(amount)
    if (!memberId) return setModalError('Selecciona un miembro.')
    if (!yearValid) return setModalError('Ingresa un año válido.')
    if (selectedMonth === null) return setModalError('Elige un mes sin cuota registrada.')
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setModalError('Ingresa un monto válido.')
    if (!session) return
    setSaving(true)
    try {
      const request = { userId: memberId, year, month: selectedMonth, amount: numericAmount, status }
      if (editing) await updateMonthlyPayment(session.accessToken, editing.backendId, request)
      else await createMonthlyPayment(session.accessToken, request)
      await load()
      setModalOpen(false); setSuccess(editing ? 'La cuota mensual se actualizó correctamente.' : 'La cuota mensual se registró correctamente.')
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }

  const cancel = async (payment: MonthlyPaymentRow) => {
    if (!session || !window.confirm('¿Anular esta cuota? La cuota quedará anulada.')) return
    setError(null); setSuccess(null)
    try {
      await cancelMonthlyPayment(session.accessToken, payment.backendId)
      await load()
      setSuccess('La cuota mensual se anuló correctamente.')
    } catch (requestError) { setError(getFriendlyApiError(requestError)) }
  }

  const isAdmin = session?.user.role === 'Admin'
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap"><div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Cuotas Mensuales</h1><p className="text-[#4e7460] text-sm">Aportes de cada miembro · Septiembre 2026</p></div>{isAdmin && <button onClick={openCreate} disabled={membersLoading || listLoading || listError !== null || activeMembers.length === 0} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-50"><Icon.Plus /> Agregar cuota</button>}</div>
      <div className="grid grid-cols-3 gap-3 mb-5"><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Recaudado</p><p className="text-lg font-bold text-[#0c1a12] mono">{formatShortCurrency(paid.reduce((total, payment) => total + payment.amount, 0))}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Pagaron</p><p className="text-lg font-bold text-[#0c1a12] mono">{paid.length}</p></div><div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Cuotas reales</p><p className="text-lg font-bold text-[#0c1a12] mono">{actual.length}</p></div></div>
      {success && !isDemo && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}{(listError ?? error) && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{listError ?? error}</p>}{listError && !listLoading && <button onClick={() => { setListLoading(true); void load() }} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3 mb-4">Reintentar</button>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{[['Miembro', 'px-3 sm:px-5 text-left'], ['Mes', 'hidden sm:table-cell px-4 text-left'], ['Monto', 'px-1 sm:px-4 text-right'], ['Fecha pago', 'hidden sm:table-cell px-4 text-left'], ['Estado', 'hidden sm:table-cell px-4 text-left'], ...(isAdmin ? [['Acciones', 'px-2 sm:px-5 text-left w-px whitespace-nowrap']] : [])].map(([heading, cls]) => <th key={heading} className={`py-3 text-[#4e7460] text-xs font-medium ${cls}`}>{heading}</th>)}</tr></thead><tbody>{listLoading && <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-[#4e7460]"><p role="status">Cargando cuotas…</p></td></tr>}{!listLoading && !listError && payments.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-[#4e7460]">Aún no hay cuotas registradas.</td></tr>}{payments.map(payment => <tr key={payment.backendId} className="table-row"><td className="px-3 sm:px-5 py-3.5"><span className="font-medium text-[#0c1a12]">{payment.member}</span><p className="sm:hidden text-xs text-[#4e7460] mt-0.5 flex items-center gap-1.5 flex-wrap"><span className="mono">{payment.month}</span><Badge status={payment.status} />{payment.paidDate && <span className="mono">{payment.paidDate}</span>}</p></td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs hidden sm:table-cell">{payment.month}</td><td className="px-1 sm:px-4 py-3.5 text-right mono text-[13px] sm:text-sm text-[#0c1a12] whitespace-nowrap">{formatCurrency(payment.amount)}</td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs hidden sm:table-cell">{payment.paidDate ?? '—'}</td><td className="px-4 py-3.5 hidden sm:table-cell"><Badge status={payment.status} /></td>{isAdmin && <td className="px-2 sm:px-5 py-3.5 text-right w-px whitespace-nowrap">{payment.status !== 'cancelled' && <div className="flex justify-end gap-1"><button onClick={() => openEdit(payment)} className="btn-ghost p-2 sm:p-1.5 rounded-md min-w-10 min-h-10 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center" aria-label="Editar cuota"><Icon.Edit /></button><button onClick={() => void cancel(payment)} className="btn-danger p-2 sm:p-1.5 rounded-md min-w-10 min-h-10 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center" aria-label="Anular cuota"><Icon.Trash /></button></div>}</td>}</tr>)}</tbody></table></div>
      {modalOpen && <Modal title={editing ? 'Editar cuota mensual' : 'Nueva cuota mensual'} onClose={() => !saving && setModalOpen(false)}><form noValidate onSubmit={event => { event.preventDefault(); void save() }} className="space-y-4"><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Miembro</label><select value={memberId} onChange={event => setMemberId(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un miembro</option>{members.filter(member => editing ? true : member.isActive).map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><label htmlFor="payment-month" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Mes</label><select id="payment-month" aria-describedby="payment-month-help" value={selectedMonth ?? ''} onChange={event => setMonth(Number(event.target.value))} disabled={!memberId || !yearValid || availableMonths.length === 0} className="w-full px-3 py-2.5 rounded-lg text-sm">{!memberId ? <option value="">Primero elige un miembro</option> : !yearValid ? <option value="">—</option> : availableMonths.length === 0 ? <option value="">Sin meses disponibles</option> : availableMonths.map(value => <option key={value} value={value}>{formatMonth(value)}</option>)}</select></div><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Año</label><input type="number" min="1" value={year} onChange={event => setYear(Number(event.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div></div><p id="payment-month-help" aria-live="polite" className="text-xs text-[#4e7460] -mt-2">{!memberId || !yearValid ? '' : availableMonths.length === 0 ? `${memberName} ya tiene cuota en todos los meses de ${year}. Prueba con otro año.` : `Solo se muestran los meses de ${year} en que ${memberName} no tiene cuota.`}</p><div><label htmlFor="payment-amount" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto</label><MoneyInput id="payment-amount" value={amount} onChange={setAmount} placeholder="50000" /></div><StatusRadioGroup name="payment-status" legend="Estado" value={status} onChange={setStatus} options={[{ value: 'Pending', badge: 'pending', hint: 'Aún no entra a la caja', disabled: editing?.status === 'paid' }, { value: 'Paid', badge: 'paid', hint: 'Registra el ingreso en la caja' }]} note={editing?.status === 'paid' ? 'Una cuota pagada no puede volver a pendiente.' : undefined} />{modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}<div className="flex gap-3 pt-1"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : editing ? 'Actualizar cuota' : 'Guardar cuota'}</button></div></form></Modal>}
    </div>
  )
}
