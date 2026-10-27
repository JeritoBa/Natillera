import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatDateOnly } from '@/features/loans/model/labels'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { useMembers } from '@/features/members/hooks/useMembers'
import { cancelMonthlyPayment, createMonthlyPayment, getMonthlyPayments, updateMonthlyPayment, type MonthlyPaymentResponse } from '@/features/monthlyPayments/api/monthlyPaymentsApi'
import { getAvailableMonths, resolveSelectedMonth } from '@/features/monthlyPayments/model/availableMonths'
import { feeCancelConsequences } from '@/features/monthlyPayments/model/cancelConfirm'
import { countPaymentsByStatus, filterPayments, paymentMemberOptions, paymentMonthOptions, parsePaymentMemberFilter, parsePaymentMonthFilter, parsePaymentStatusFilter } from '@/features/monthlyPayments/model/paymentFilters'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth, formatShortCurrency } from '@/shared/lib/formatters'
import { toMoneyInputValue } from '@/shared/lib/money'
import { useClearUrlParams, useUrlParam } from '@/shared/lib/useUrlFilter'
import { Badge } from '@/shared/ui/Badge'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ConfirmSummary } from '@/shared/ui/ConfirmSummary'
import { Icon } from '@/shared/ui/Icon'
import { FormError } from '@/shared/ui/FormError'
import { Modal } from '@/shared/ui/Modal'
import { StatusRadioGroup } from '@/shared/ui/StatusRadioGroup'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { StatCard } from '@/shared/ui/StatCard'
import { cell, cellActions, cellAmount, cellFirst, cellLast, cellMain, colDesktop, colTablet, dangerButton, headCell, iconButton, subMobile, subTablet, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'

type MonthlyPaymentRow = {
  backendId: string; userId: string; member: string; year: number; monthNumber: number; month: string; amount: number
  paidDate: string | null; status: 'pending' | 'paid' | 'cancelled'
}

const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
// UI-15: the filters live in the URL.
const filterKeys = ['member', 'month', 'status'] as const

const toRow = (payment: MonthlyPaymentResponse): MonthlyPaymentRow => ({
  backendId: payment.id, userId: payment.userId, member: payment.memberName, year: payment.year, monthNumber: payment.month,
  month: `${formatMonth(payment.month).slice(0, 3)} ${payment.year}`, amount: payment.amount,
  paidDate: payment.paidAt?.slice(0, 10) ?? null, status: payment.status.toLowerCase() as MonthlyPaymentRow['status'],
})

export function MonthlyPaymentsPage() {
  const { session, isDemo } = useAuth()
  const { members, loading: membersLoading } = useMembers()
  const { selected } = useSavingPeriod()
  const [payments, setPayments] = useState<MonthlyPaymentRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MonthlyPaymentRow | null>(null)
  const [memberId, setMemberId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Paid')
  const [saving, setSaving] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<MonthlyPaymentRow | null>(null)
  const [focusSuccess, setFocusSuccess] = useState(0)
  const successRef = useRef<HTMLParagraphElement>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterMember, setFilterMember] = useUrlParam('member', parsePaymentMemberFilter, 'all')
  const [filterMonth, setFilterMonth] = useUrlParam('month', parsePaymentMonthFilter, 'all')
  const [filterStatus, setFilterStatus] = useUrlParam('status', parsePaymentStatusFilter, 'all')
  const clearFilters = useClearUrlParams(filterKeys)
  const activeMembers = members.filter(member => member.isActive)

  const load = useCallback(async () => {
    if (!session) return
    try { setPayments((await getMonthlyPayments(session.accessToken)).map(toRow)); setListError(null) }
    catch (requestError) { setListError(getFriendlyApiError(requestError)) }
    finally { setListLoading(false) }
  }, [session])

  // MP-10: the Mes select only offers months without a non-cancelled fee for the member and year; the edited fee never blocks itself.
  const feePeriods = useMemo(() => payments.map(payment => ({ id: payment.backendId, userId: payment.userId, year: payment.year, month: payment.monthNumber, cancelled: payment.status === 'cancelled' })), [payments])
  // MP-11: new fees belong to the selected period; an edited fee keeps its own year.
  const year = editing?.year ?? selected?.year ?? new Date().getFullYear()
  const availableMonths = getAvailableMonths(feePeriods, memberId, year, editing?.backendId)
  const selectedMonth = resolveSelectedMonth(month, availableMonths, new Date())
  const memberOption = members.find(member => member.id === memberId)
  const memberName = memberOption ? `${memberOption.firstName} ${memberOption.lastName}` : ''

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const openCreate = () => {
    setEditing(null); setMemberId(activeMembers[0]?.id ?? ''); setMonth(new Date().getMonth() + 1); setAmount(''); setStatus('Paid'); setModalError(null); setSuccess(null); setModalOpen(true)
  }

  const openEdit = (payment: MonthlyPaymentRow) => {
    setEditing(payment); setMemberId(payment.userId); setMonth(payment.monthNumber); setAmount(toMoneyInputValue(payment.amount)); setStatus(payment.status === 'paid' ? 'Paid' : 'Pending'); setModalError(null); setSuccess(null); setModalOpen(true)
  }

  const save = async () => {
    if (saving) return
    setSubmitCount(count => count + 1)
    setModalError(null); setSuccess(null)
    const numericAmount = Number(amount)
    if (!memberId) return setModalError('Selecciona un miembro.')
    if (selectedMonth === null) return setModalError('Elige un mes sin cuota registrada.')
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setModalError('Ingresa un monto válido.')
    if (!session) return
    setSaving(true)
    try {
      const request = { userId: memberId, month: selectedMonth, amount: numericAmount, status }
      if (editing) await updateMonthlyPayment(session.accessToken, editing.backendId, request)
      else await createMonthlyPayment(session.accessToken, request)
      await load()
      setModalOpen(false); setSuccess(editing ? 'La cuota mensual se actualizó correctamente.' : 'La cuota mensual se registró correctamente.')
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }

  // UI-13: errors propagate to the confirmation dialog.
  const confirmCancel = async (payment: MonthlyPaymentRow) => {
    if (!session) return
    await cancelMonthlyPayment(session.accessToken, payment.backendId)
    setConfirmTarget(null)
    setSuccess('La cuota mensual se anuló correctamente.')
    setFocusSuccess(count => count + 1)
    await load()
  }

  // UI-13: after a cancellation the trigger button disappears, so the focus moves to the success banner.
  useEffect(() => { if (focusSuccess > 0) successRef.current?.focus() }, [focusSuccess])

  const isAdmin = session?.user.role === 'Admin'
  // MP-09: Members only receive Paid fees, so the status filter is Admin only.
  const memberOptions = paymentMemberOptions(payments)
  const monthOptions = paymentMonthOptions(payments)
  const effectiveMember = filterMember !== 'all' && memberOptions.some(option => option.id === filterMember) ? filterMember : 'all'
  const effectiveMonth = filterMonth !== 'all' && monthOptions.some(option => option.key === filterMonth) ? filterMonth : 'all'
  const effectiveStatus = isAdmin ? filterStatus : 'all'
  const filtered = filterPayments(payments, effectiveMember, effectiveMonth, effectiveStatus)
  // The status buttons count the fees left by the member and month filters.
  const statusCounts = countPaymentsByStatus(filterPayments(payments, effectiveMember, effectiveMonth))
  const hasFilters = effectiveMember !== 'all' || effectiveMonth !== 'all' || effectiveStatus !== 'all'
  const monthText = (key: string) => `${formatMonth(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`
  const paid = filtered.filter(payment => payment.status === 'paid')
  const actual = filtered.filter(payment => payment.status !== 'cancelled')
  const filterSuffix = hasFilters ? ' (filtro)' : ''
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap"><div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Cuotas Mensuales</h1><p className="text-[#4e7460] text-sm">Aportes de cada miembro{selected ? ` · Periodo ${selected.year}` : ''}</p></div>{isAdmin && <button onClick={openCreate} disabled={membersLoading || listLoading || listError !== null || activeMembers.length === 0} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-50"><Icon.Plus /> Agregar cuota</button>}</div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <StatCard label={`Recaudado${filterSuffix}`} value={formatShortCurrency(paid.reduce((total, payment) => total + payment.amount, 0))} />
        <StatCard label={`Cuotas pagadas${filterSuffix}`} value={paid.length} />
        <StatCard label={`Cuotas vigentes${filterSuffix}`} value={actual.length} />
      </dl>
      {success && !isDemo && <p ref={successRef} tabIndex={-1} role="status" className="mb-4 outline-none rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}{listError && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{listError}</p>}{listError && !listLoading && <button onClick={() => { setListLoading(true); void load() }} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3 mb-4">Reintentar</button>}
      {!listLoading && !listError && payments.length > 0 && <div className="rounded-xl p-4 mb-4 space-y-3" style={cardStyle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="payment-member-filter" className="block text-xs text-[#4e7460] mb-1">Miembro</label>
            <select id="payment-member-filter" value={effectiveMember} onChange={event => setFilterMember(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="all">Todos los miembros</option>
              {memberOptions.map(option => <option key={option.id} value={option.id}>{`${option.name} (${option.count})`}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="payment-month-filter" className="block text-xs text-[#4e7460] mb-1">Mes de la cuota</label>
            <select id="payment-month-filter" value={effectiveMonth} onChange={event => setFilterMonth(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="all">Todos los meses</option>
              {monthOptions.map(option => <option key={option.key} value={option.key}>{`${monthText(option.key)} (${option.count})`}</option>)}
            </select>
          </div>
        </div>
        {isAdmin && <div role="group" aria-label="Filtrar por estado" className="flex gap-1.5 flex-wrap">
          {([['all', 'Todas'], ['pending', 'Pendientes'], ['paid', 'Pagadas'], ['cancelled', 'Anuladas']] as const).map(([value, label]) =>
            <button key={value} type="button" aria-pressed={filterStatus === value} onClick={() => setFilterStatus(value)} className={`px-3 min-h-10 rounded-lg text-xs font-medium transition-all ${filterStatus === value ? 'bg-[#0c5c38] text-white' : 'btn-ghost'}`}>{label} ({statusCounts[value]})</button>)}
        </div>}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#4e7460]" aria-live="polite">Mostrando {filtered.length} de {payments.length} cuotas</p>
          {hasFilters && <button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs">Limpiar filtros</button>}
        </div>
      </div>}
      <div className={tableWrap} style={cardStyle}><div className={tableScroll}><table className="w-full text-sm"><thead><tr style={tableHeadStyle}>{[['Miembro', `${cellFirst} text-left`], ['Mes', `${cell} ${colTablet} text-left`], ['Monto', `${cell} text-right`], ['Fecha pago', `${cell} ${colDesktop} text-left`], ['Estado', `${cell} ${colTablet} text-left`], ...(isAdmin ? [['Acciones', `${cellLast} text-right w-px whitespace-nowrap`]] : [])].map(([heading, cls]) => <th key={heading} className={`${headCell} ${cls}`}>{heading}</th>)}</tr></thead><tbody>
        {listLoading && <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-[#4e7460]"><p role="status">Cargando cuotas…</p></td></tr>}
        {!listLoading && !listError && payments.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-[#4e7460]">Aún no hay cuotas registradas.</td></tr>}
        {!listLoading && payments.length > 0 && filtered.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-[#4e7460]"><p>No hay cuotas que coincidan con los filtros.</p><button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Limpiar filtros</button></td></tr>}
        {filtered.map(payment => <tr key={payment.backendId} className="table-row">
          <td className={`${cellFirst} py-3.5 ${cellMain}`}>
            <span className="block line-clamp-2 break-words sm:line-clamp-none font-medium text-[#0c1a12]" title={payment.member}>{payment.member}</span>
            <p className={subMobile}><span className="mono">{payment.month}</span><Badge status={payment.status} />{payment.paidDate && <span className="mono whitespace-nowrap">{formatDateOnly(payment.paidDate)}</span>}</p>
            {payment.paidDate && <p className={subTablet}><span className="whitespace-nowrap">Pagada el <span className="mono">{formatDateOnly(payment.paidDate)}</span></span></p>}
          </td>
          <td className={`${cell} ${colTablet} py-3.5 text-[#4e7460] mono text-xs`}>{payment.month}</td>
          <td className={`${cell} px-2 sm:px-4 py-3.5 ${cellAmount} text-sm text-[#0c1a12]`}>{formatCurrency(payment.amount)}</td>
          <td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap`}>{payment.paidDate ? formatDateOnly(payment.paidDate) : '—'}</td>
          <td className={`${cell} ${colTablet} py-3.5`}><Badge status={payment.status} /></td>
          {isAdmin && <td className={`${cellLast} py-3.5 pl-1 ${cellActions}`}>{payment.status !== 'cancelled' && <div className="flex justify-end"><button onClick={() => openEdit(payment)} className={iconButton} aria-label="Editar cuota"><Icon.Edit /></button><button onClick={() => { setSuccess(null); setConfirmTarget(payment) }} className={dangerButton} aria-label="Anular cuota"><Icon.Trash /></button></div>}</td>}
        </tr>)}
      </tbody></table></div></div>
      {modalOpen && <Modal title={editing ? 'Editar cuota mensual' : 'Nueva cuota mensual'} onClose={() => !saving && setModalOpen(false)}><form noValidate onSubmit={event => { event.preventDefault(); void save() }} className="space-y-4"><div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Miembro</label><select value={memberId} onChange={event => setMemberId(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un miembro</option>{members.filter(member => editing ? true : member.isActive).map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div><div><label htmlFor="payment-month" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Mes</label><select id="payment-month" aria-describedby="payment-month-help" value={selectedMonth ?? ''} onChange={event => setMonth(Number(event.target.value))} disabled={!memberId || availableMonths.length === 0} className="w-full px-3 py-2.5 rounded-lg text-sm">{!memberId ? <option value="">Primero elige un miembro</option> : availableMonths.length === 0 ? <option value="">Sin meses disponibles</option> : availableMonths.map(value => <option key={value} value={value}>{formatMonth(value)}</option>)}</select><p className="text-xs text-[#4e7460] mt-1.5">Se registra en el periodo <strong>{year}</strong>.</p></div><p id="payment-month-help" aria-live="polite" className="text-xs text-[#4e7460] -mt-2">{!memberId ? '' : availableMonths.length === 0 ? `${memberName} ya tiene cuota en todos los meses de ${year}. Para otro año, cambia el periodo en Configuración.` : `Solo se muestran los meses de ${year} en que ${memberName} no tiene cuota.`}</p><div><label htmlFor="payment-amount" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto</label><MoneyInput id="payment-amount" value={amount} onChange={setAmount} placeholder="50000" /></div><StatusRadioGroup name="payment-status" legend="Estado" value={status} onChange={setStatus} options={[{ value: 'Pending', badge: 'pending', hint: 'Aún no entra a la caja', disabled: editing?.status === 'paid' }, { value: 'Paid', badge: 'paid', hint: 'Registra el ingreso en la caja' }]} note={editing?.status === 'paid' ? 'Una cuota pagada no puede volver a pendiente.' : undefined} /><FormError message={modalError} revision={submitCount} /><div className="flex gap-3 pt-1"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : editing ? 'Actualizar cuota' : 'Guardar cuota'}</button></div></form></Modal>}
      {confirmTarget && <ConfirmDialog title="Anular cuota" confirmLabel="Anular cuota" consequences={feeCancelConsequences()} onClose={() => setConfirmTarget(null)} onConfirm={() => confirmCancel(confirmTarget)}
        summary={<ConfirmSummary title={confirmTarget.member} detail={confirmTarget.month} amount={formatCurrency(confirmTarget.amount)} status={confirmTarget.status} />} />}
    </div>
  )
}
