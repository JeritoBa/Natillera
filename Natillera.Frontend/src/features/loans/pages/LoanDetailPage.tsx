import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  cancelInterestPayment, cancelLoanPayment, createInterestPayment, createLoanPayment, getLoanDetail, updateInterestPayment, updateLoanPayment,
  type InterestPaymentResponse, type LoanDetail, type LoanPaymentResponse, type PaymentMethod,
} from '@/features/loans/api/loansApi'
import { formatDateOnly, methodLabel } from '@/features/loans/model/labels'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

const card = { background: '#fff', border: '1px solid #d6e8dc' }
const cell = (label: string, value: React.ReactNode) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><div className="text-sm text-[#0c1a12] break-words">{value}</div></div>
const header = (headings: string[], rightIndexes: number[]) => <thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{headings.map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${rightIndexes.includes(index) ? 'text-right' : 'text-left'}`}>{heading}</th>)}</tr></thead>

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const canManage = session?.user.role === 'Admin'
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modal, setModal] = useState<'payment' | 'interest' | null>(null)
  const [editingPayment, setEditingPayment] = useState<LoanPaymentResponse | null>(null)
  const [editingInterest, setEditingInterest] = useState<InterestPaymentResponse | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [description, setDescription] = useState('')
  const [interestStatus, setInterestStatus] = useState<'Pending' | 'Paid'>('Pending')
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!session || !id) return
    try { setLoan(await getLoanDetail(session.accessToken, id)); setError(null) }
    catch (requestError) {
      setError(requestError instanceof ApiError && requestError.status === 404 ? 'No se encontró el préstamo solicitado.' : getFriendlyApiError(requestError))
    }
  }, [id, session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  if (error && !loan) return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/loans')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!loan) return <div className="p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const isCancelled = loan.status === 'Cancelled'
  const openPayment = (payment: LoanPaymentResponse | null) => {
    setEditingPayment(payment); setAmount(payment ? String(payment.amount) : ''); setMethod(payment?.paymentMethod ?? 'Cash'); setModalError(null); setSuccess(null); setActionError(null); setModal('payment')
  }
  const openInterest = (interest: InterestPaymentResponse | null) => {
    setEditingInterest(interest); setAmount(interest ? String(interest.amount) : ''); setDescription(interest?.description ?? ''); setInterestStatus(interest?.status === 'Paid' ? 'Paid' : 'Pending'); setModalError(null); setSuccess(null); setActionError(null); setModal('interest')
  }
  const save = async () => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setModalError('Ingresa un monto válido.')
    if (modal === 'interest' && !description.trim()) return setModalError('Ingresa una descripción.')
    if (!session) return
    setSaving(true); setModalError(null)
    try {
      if (modal === 'payment') {
        const request = { amount: numericAmount, paymentMethod: method }
        if (editingPayment) await updateLoanPayment(session.accessToken, loan.id, editingPayment.id, request)
        else await createLoanPayment(session.accessToken, loan.id, request)
        setSuccess(editingPayment ? 'El abono se actualizó correctamente.' : 'El abono se registró correctamente.')
      } else {
        const request = { amount: numericAmount, description: description.trim(), status: interestStatus }
        if (editingInterest) await updateInterestPayment(session.accessToken, loan.id, editingInterest.id, request)
        else await createInterestPayment(session.accessToken, loan.id, request)
        setSuccess(editingInterest ? 'El interés se actualizó correctamente.' : 'El interés se registró correctamente.')
      }
      setModal(null)
      await load()
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }
  const cancel = async (kind: 'payment' | 'interest', recordId: string) => {
    if (!session) return
    setSuccess(null); setActionError(null)
    try {
      if (kind === 'payment') await cancelLoanPayment(session.accessToken, loan.id, recordId)
      else await cancelInterestPayment(session.accessToken, loan.id, recordId)
      setSuccess(kind === 'payment' ? 'El abono se anuló correctamente.' : 'El interés se anuló correctamente.')
      await load()
    } catch (requestError) { setActionError(getFriendlyApiError(requestError)) }
  }

  const { summary } = loan
  const fields: [string, React.ReactNode][] = [
    ['Deudor', loan.borrowerName], ['Monto inicial', formatCurrency(loan.initialAmount)], ['Tasa de interés', `${loan.interestRate}%`], ['Fecha de inicio', formatDateOnly(loan.startDate)],
    ['Fecha de finalización', loan.endDate ? formatDateOnly(loan.endDate) : '—'], ['Estado', <Badge status={loan.status.toLowerCase()} />],
    ['Fecha de creación', new Date(loan.createdAt).toLocaleString('es-CO')], ['Última actualización', loan.updatedAt ? new Date(loan.updatedAt).toLocaleString('es-CO') : '—'],
  ]
  const stats: [string, number, boolean][] = [
    ['Capital abonado', summary.principalPaid, false], ['Capital pendiente', summary.outstandingPrincipal, false], ['Intereses generados', summary.interestGenerated, false],
    ['Intereses pagados', summary.interestPaid, false], ['Interés pendiente', summary.outstandingInterest, false], ['Total por pagar', summary.totalOutstanding, true],
  ]
  const actions = (kind: 'payment' | 'interest', recordId: string, cancelled: boolean, onEdit: () => void) => <td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1">
    <button onClick={() => navigate(kind === 'payment' ? `/loans/${loan.id}/payments/${recordId}` : `/loans/${loan.id}/interest-payments/${recordId}`)} className="btn-ghost p-1.5 rounded-md" aria-label="Ver detalle"><Icon.Eye open /></button>
    {canManage && !cancelled && <>
      <button onClick={onEdit} className="btn-ghost p-1.5 rounded-md" aria-label={kind === 'payment' ? 'Editar abono' : 'Editar interés'}><Icon.Edit /></button>
      <button onClick={() => { if (window.confirm(kind === 'payment' ? '¿Anular este abono? El abono quedará anulado.' : '¿Anular este interés? El interés quedará anulado.')) void cancel(kind, recordId) }} className="btn-danger p-1.5 rounded-md" aria-label={kind === 'payment' ? 'Anular abono' : 'Anular interés'}><Icon.Trash /></button>
    </>}
  </div></td>

  return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/loans')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a préstamos</button><div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de préstamo</h1><p className="text-[#4e7460] text-sm">Información, resumen, abonos e intereses del préstamo</p></div>
    {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
    {(actionError || error) && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{actionError ?? error}</p>}
    <div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{fields.map(([label, value]) => cell(label, value))}</div>
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-6">{stats.map(([label, value, highlight]) => <div key={label} className="stat-card rounded-xl p-4" style={highlight ? { border: '1px solid #0c5c38' } : undefined}><p className="text-[#4e7460] text-xs mb-3">{label}</p><p className={`text-xl font-bold mono ${highlight ? 'text-[#0a6635]' : 'text-[#0c1a12]'}`}>{formatCurrency(value)}</p></div>)}</div>
    <div className="flex items-center justify-between mt-6 mb-3 gap-4 flex-wrap"><h2 className="text-sm font-bold text-[#0c1a12]">Abonos a capital</h2>{canManage && !isCancelled && <button onClick={() => openPayment(null)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Registrar abono</button>}</div>
    <div className="rounded-xl overflow-hidden" style={card}><div className="overflow-x-auto"><table className="w-full text-sm">{header(['Fecha', 'Monto', 'Método', 'Estado', 'Acciones'], [1, 4])}<tbody>
      {loan.payments.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[#4e7460]">Este préstamo no tiene abonos registrados</td></tr>}
      {loan.payments.map(payment => <tr key={payment.id} className="table-row"><td className="px-5 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(payment.paidAt).toLocaleDateString('es-CO')}</td><td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(payment.amount)}</td><td className="px-4 py-3.5 text-[#4e7460]">{methodLabel[payment.paymentMethod]}</td><td className="px-4 py-3.5"><Badge status={payment.status.toLowerCase()} /></td>{actions('payment', payment.id, payment.status === 'Cancelled', () => openPayment(payment))}</tr>)}
    </tbody></table></div></div>
    <div className="flex items-center justify-between mt-6 mb-3 gap-4 flex-wrap"><h2 className="text-sm font-bold text-[#0c1a12]">Intereses</h2>{canManage && !isCancelled && <button onClick={() => openInterest(null)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Registrar interés</button>}</div>
    <div className="rounded-xl overflow-hidden" style={card}><div className="overflow-x-auto"><table className="w-full text-sm">{header(['Fecha de registro', 'Descripción', 'Monto', 'Estado', 'Fecha de pago', 'Acciones'], [2, 5])}<tbody>
      {loan.interestPayments.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#4e7460]">Este préstamo no tiene intereses registrados</td></tr>}
      {loan.interestPayments.map(interest => <tr key={interest.id} className="table-row"><td className="px-5 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(interest.createdAt).toLocaleDateString('es-CO')}</td><td className="px-4 py-3.5 text-[#0c1a12] max-w-[220px] truncate">{interest.description}</td><td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(interest.amount)}</td><td className="px-4 py-3.5"><Badge status={interest.status.toLowerCase()} /></td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{interest.paidAt ? new Date(interest.paidAt).toLocaleDateString('es-CO') : '—'}</td>{actions('interest', interest.id, interest.status === 'Cancelled', () => openInterest(interest))}</tr>)}
    </tbody></table></div></div>
    {modal && <Modal title={modal === 'payment' ? (editingPayment ? 'Editar abono' : 'Registrar abono') : (editingInterest ? 'Editar interés' : 'Registrar interés')} onClose={() => !saving && setModal(null)}><div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto</label><input type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="50000" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
      {modal === 'payment' && <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Método de pago</label><select value={method} onChange={event => setMethod(event.target.value as PaymentMethod)} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="Cash">Efectivo</option><option value="Transfer">Transferencia</option></select></div>}
      {modal === 'interest' && <>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Descripción</label><input type="text" maxLength={200} value={description} onChange={event => setDescription(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Estado</label><select value={interestStatus} onChange={event => setInterestStatus(event.target.value as 'Pending' | 'Paid')} disabled={editingInterest?.status === 'Paid'} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="Pending">Pendiente</option><option value="Paid">Pagado</option></select></div>
      </>}
      {modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}
      <div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </div></Modal>}
  </div>
}
