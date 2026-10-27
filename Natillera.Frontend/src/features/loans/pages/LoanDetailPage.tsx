import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appName } from '@/app/useDocumentTitle'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  cancelInterestPayment, cancelLoanPayment, createInterestPayment, createLoanPayment, getLoanDetail, updateInterestPayment, updateLoanPayment,
  type InterestPaymentResponse, type LoanDetail, type LoanPaymentResponse, type PaymentMethod,
} from '@/features/loans/api/loansApi'
import { longDate, methodLabel } from '@/features/loans/model/labels'
import { getLoanSummary } from '@/features/loans/model/loanSummary'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { FormError } from '@/shared/ui/FormError'
import { Modal } from '@/shared/ui/Modal'
import { toMoneyInputValue } from '@/shared/lib/money'
import { StatusRadioGroup } from '@/shared/ui/StatusRadioGroup'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { cell, cellActions, cellAmount, cellFirst, cellLast, cellMain, colDesktop, colTablet, dangerButton, eyeButton, headCell, iconButton, mainLink, subMobile, subTablet, tableHeadStyle, tableScroll } from '@/shared/ui/tableStyles'

const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
const rowClass = 'flex justify-between border-t border-[#eef4f0] pt-2'
const statusOrder = { Pending: 0, Paid: 1, Cancelled: 2 }
const shortDate = (value: string) => new Date(value).toLocaleDateString('es-CO')
const paymentHeadings: [string, string, boolean][] = [
  ['Fecha', cellFirst, false], ['Monto', cell, true], ['Método', `${cell} ${colTablet}`, false], ['Estado', `${cell} ${colTablet}`, false], ['Acciones', `${cellLast} w-px whitespace-nowrap`, true],
]
const interestHeadings: [string, string, boolean][] = [
  ['Descripción', cellFirst, false], ['Registrado', `${cell} ${colDesktop}`, false], ['Monto', cell, true], ['Pagado el', `${cell} ${colDesktop}`, false],
  ['Estado', `${cell} ${colTablet}`, false], ['Acciones', `${cellLast} w-px whitespace-nowrap`, true],
]
const dot = (color: string, border?: string) => <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: color, ...(border ? { border } : {}) }} />

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, isDemo } = useAuth()
  const canManage = session?.user.role === 'Admin'
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
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
  const [submitCount, setSubmitCount] = useState(0)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    if (!session || !id) return
    const current = ++requestId.current
    setLoading(true); setError(null); setNotFound(false); setLoan(null)
    try {
      const result = await getLoanDetail(session.accessToken, id)
      if (current === requestId.current) setLoan(result)
    } catch (requestError) {
      if (current !== requestId.current) return
      if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true)
      else setError(getFriendlyApiError(requestError))
    } finally {
      if (current === requestId.current) setLoading(false)
    }
  }, [id, session])

  const refresh = useCallback(async () => {
    if (!session || !id) return
    const current = ++requestId.current
    try {
      const result = await getLoanDetail(session.accessToken, id)
      if (current === requestId.current) { setLoan(result); setActionError(null) }
    } catch (requestError) {
      if (current === requestId.current) setActionError(getFriendlyApiError(requestError))
    }
  }, [id, session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (loan) document.title = `Préstamo de ${loan.borrowerName} · ${appName}`
  }, [loan])

  const back = <button onClick={() => navigate('/loans')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a préstamos</button>

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">{back}<p role="status" className="text-[#4e7460]">Cargando préstamo…</p></div>
  if (notFound) return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">{back}
    <div role="alert" className="rounded-xl p-8 text-center" style={cardStyle}>
      <h1 className="text-lg font-bold text-[#0c1a12]">No se encontró el préstamo</h1>
      <p className="text-sm text-[#4e7460]">Puede que el enlace esté incompleto o que el préstamo no exista. Puede pertenecer a otro periodo.</p>
      <button onClick={() => navigate('/loans')} className="btn-primary px-4 py-2 rounded-lg text-sm mt-4">Ver lista de préstamos</button>
    </div>
  </div>
  if (error || !loan) return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">{back}
    <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>
    <button onClick={() => void load()} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3">Reintentar</button>
  </div>

  const summary = getLoanSummary(loan)
  const { isCancelled } = summary
  const activeCount = summary.activePayments.length
  const maxPayment = summary.outstandingPrincipal + (editingPayment?.amount ?? 0)
  const sortedPayments = [...loan.payments].sort((a, b) =>
    Number(a.status === 'Cancelled') - Number(b.status === 'Cancelled') || new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())
  const sortedInterests = [...loan.interestPayments].sort((a, b) =>
    statusOrder[a.status] - statusOrder[b.status] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const activeInterestCount = loan.interestPayments.filter(item => item.status !== 'Cancelled').length
  const hasInterest = summary.interestGenerated > 0

  const openPayment = (payment: LoanPaymentResponse | null) => {
    setEditingPayment(payment); setAmount(payment ? toMoneyInputValue(payment.amount) : ''); setMethod(payment?.paymentMethod ?? 'Cash'); setModalError(null); setSuccess(null); setActionError(null); setModal('payment')
  }
  const openInterest = (interest: InterestPaymentResponse | null) => {
    setEditingInterest(interest); setAmount(interest ? toMoneyInputValue(interest.amount) : ''); setDescription(interest?.description ?? ''); setInterestStatus(interest?.status === 'Paid' ? 'Paid' : 'Pending'); setModalError(null); setSuccess(null); setActionError(null); setModal('interest')
  }
  const save = async () => {
    if (saving) return
    setSubmitCount(count => count + 1)
    setModalError(null)
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setModalError('Ingresa un monto válido.')
    if (modal === 'payment' && numericAmount > maxPayment) return setModalError(`El abono no puede superar el capital pendiente (${formatCurrency(maxPayment)}).`)
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
        setSuccess(editingInterest
          ? (editingInterest.status === 'Pending' && interestStatus === 'Paid' ? 'El interés se marcó como pagado.' : 'El interés se actualizó correctamente.')
          : 'El interés se registró correctamente.')
      }
      setModal(null)
      await refresh()
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
      await refresh()
    } catch (requestError) { setActionError(getFriendlyApiError(requestError)) }
  }

  const info: [string, ReactNode][] = [
    ['Deudor', loan.borrowerName], ['Cantidad prestada', formatCurrency(loan.initialAmount)], ['Tasa de interés', `${loan.interestRate}%`], ['Fecha de inicio', longDate(loan.startDate)],
    ['Fecha de finalización', loan.endDate ? longDate(loan.endDate) : '—'], ['Estado', <Badge status={loan.status.toLowerCase()} />],
    ['Fecha de creación', new Date(loan.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })],
    ['Última actualización', loan.updatedAt ? new Date(loan.updatedAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) : 'Sin cambios desde la creación'],
  ]
  const paidInFull = !isCancelled && summary.totalOutstanding === 0
  const totalNote = isCancelled ? 'No aplica: préstamo anulado'
    : paidInFull ? `Préstamo pagado por completo${loan.endDate ? ` el ${longDate(loan.endDate)}` : ''}`
      : 'Capital pendiente + intereses pendientes. No incluye intereses aún no registrados.'
  const breakdown: [string, ReactNode, string][] = [
    ['Capital pendiente', isCancelled ? '—' : formatCurrency(summary.outstandingPrincipal), `de ${formatCurrency(loan.initialAmount)} prestados`],
    ['Intereses pendientes', formatCurrency(summary.outstandingInterest), summary.pendingInterestCount > 0 ? `${summary.pendingInterestCount} intereses sin pagar` : 'Nada pendiente'],
    ['Total pagado', formatCurrency(summary.totalPaid), 'Capital + intereses pagados'],
  ]
  // Same condition as the loans list edit button (LOAN-07).
  const canEditDescription = canManage && loan.status === 'Active' && summary.outstandingPrincipal === loan.initialAmount
  const paymentConfirm = (payment: LoanPaymentResponse) => `¿Anular el abono de ${formatCurrency(payment.amount)} del ${shortDate(payment.paidAt)}? El abono y su ingreso quedarán anulados y el capital pendiente aumentará.`
  const interestConfirm = (interest: InterestPaymentResponse) => interest.status === 'Paid'
    ? `¿Anular el interés pagado «${interest.description}»? El interés y su ingreso quedarán anulados.`
    : `¿Anular el interés «${interest.description}»? El interés quedará anulado.`

  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
    {back}
    <div className="mb-7">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-[#0c1a12] break-words">{loan.borrowerName}</h1>
        <Badge status={loan.status.toLowerCase()} />
      </div>
      <p className="text-[#4e7460] text-sm mt-0.5">Préstamo de {formatCurrency(loan.initialAmount)} · inicia el {longDate(loan.startDate)}</p>
      {isCancelled && <p role="status" className="mt-3 rounded-lg border border-[#d6e8dc] bg-[#eef4f0] px-3 py-2.5 text-sm text-[#4e7460]">Este préstamo está anulado. Su desembolso ya no cuenta como egreso y no admite cambios.</p>}
    </div>
    {success && !isDemo && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
    {actionError && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{actionError}</p>}

    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section aria-labelledby="loan-total-title" className="rounded-xl p-5 lg:p-6 text-white md:col-span-2" style={{ background: '#0c5c38' }}>
          <h2 id="loan-total-title" className="text-sm font-medium text-[#cfe8da]">Total por pagar</h2>
          <p className="mono font-bold text-3xl md:text-4xl mt-2 break-words">{isCancelled ? '—' : formatCurrency(summary.totalOutstanding)}</p>
          <p className="text-sm text-[#cfe8da] mt-2">{totalNote}</p>
          <dl className="border-t border-white/20 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {breakdown.map(([label, value, note]) => <div key={label}>
              <dt className="text-xs text-[#cfe8da]">{label}</dt>
              <dd className="mono text-base font-semibold text-white">{value}</dd>
              <dd className="text-xs text-[#cfe8da]">{note}</dd>
            </div>)}
          </dl>
        </section>

        {(loan.description || canManage) && <section aria-labelledby="loan-description-title" className="rounded-xl overflow-hidden md:col-span-2" style={cardStyle}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#eef4f0' }}><h2 id="loan-description-title" className="text-sm font-semibold text-[#0c1a12]">Descripción</h2></div>
          {loan.description
            ? <p className="px-5 py-4 text-sm sm:text-[15px] leading-7 text-[#0c1a12] whitespace-pre-line break-words [overflow-wrap:anywhere] max-w-prose">{loan.description}</p>
            : <div className="px-5 py-4 text-sm text-[#4e7460]">
              <p className="italic">Sin descripción.</p>
              {canEditDescription && <p className="mt-1">Puedes agregarla desde «Editar préstamo» en la lista de préstamos.</p>}
            </div>}
        </section>}

        <section aria-labelledby="loan-capital-title" className="rounded-xl p-5" style={cardStyle}>
          <h2 id="loan-capital-title" className="text-sm font-semibold text-[#0c1a12]">Capital</h2>
          <p className="mono text-2xl font-bold text-[#0c1a12] mt-2">{formatCurrency(loan.initialAmount)}</p>
          <p className="text-xs text-[#4e7460]">cantidad prestada</p>
          <div aria-hidden="true" className="flex h-2 rounded overflow-hidden bg-[#eef4f0] mt-3">
            <div style={{ width: `${summary.principalPaidPct}%`, background: '#0c5c38' }} />
            <div style={{ width: `${isCancelled ? 0 : Math.max(0, 100 - summary.principalPaidPct)}%`, background: '#9a6e00' }} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className={rowClass}><dt className="text-[#0c1a12]">{dot('#0c5c38')}Capital abonado</dt><dd className="mono text-[#0c1a12]">{formatCurrency(summary.principalPaid)} <span className="text-xs text-[#4e7460]">· {activeCount} abonos</span></dd></div>
            <div className={rowClass}><dt className="text-[#0c1a12]">{dot('#9a6e00')}Capital pendiente</dt><dd className="mono text-[#0c1a12]">{isCancelled ? '—' : formatCurrency(summary.outstandingPrincipal)}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="loan-interest-title" className="rounded-xl p-5" style={cardStyle}>
          <h2 id="loan-interest-title" className="text-sm font-semibold text-[#0c1a12]">Intereses</h2>
          <p className="mono text-2xl font-bold text-[#0c1a12] mt-2">{formatCurrency(summary.interestGenerated)}</p>
          <p className="text-xs text-[#4e7460]">{hasInterest ? `intereses generados · tasa ${loan.interestRate}%` : `Aún no hay intereses registrados · tasa ${loan.interestRate}%`}</p>
          <div aria-hidden="true" className="flex h-2 rounded overflow-hidden bg-[#eef4f0] mt-3">
            {hasInterest && <>
              <div style={{ width: `${summary.interestPaidPct}%`, background: '#0c5c38' }} />
              <div style={{ width: `${Math.max(0, 100 - summary.interestPaidPct)}%`, background: '#9a6e00' }} />
            </>}
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className={rowClass}><dt className="text-[#0c1a12]">{dot('#0c5c38')}Intereses pagados</dt><dd className="mono text-[#0c1a12]">{formatCurrency(summary.interestPaid)}</dd></div>
            <div className={rowClass}><dt className="text-[#0c1a12]">{dot('#9a6e00')}Intereses pendientes</dt><dd className="mono text-[#0c1a12]">{formatCurrency(summary.outstandingInterest)}</dd></div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="loan-payments-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: '#eef4f0' }}>
          <h2 id="loan-payments-title" className="text-sm font-semibold text-[#0c1a12]">Abonos a capital <span className="text-[#4e7460] font-normal">({activeCount})</span></h2>
          {canManage && !isCancelled && summary.outstandingPrincipal > 0 && <button onClick={() => openPayment(null)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Registrar abono</button>}
          {canManage && !isCancelled && summary.outstandingPrincipal === 0 && <p className="text-xs text-[#4e7460]">El capital está pagado por completo</p>}
        </div>
        {sortedPayments.length === 0
          ? <div className="px-5 py-10 text-center text-sm text-[#4e7460]">
            <p>Aún no hay abonos registrados.</p>
            {canManage && !isCancelled && <p>Usa «Registrar abono» para el primero.</p>}
          </div>
          : <div className={tableScroll}><table className="w-full text-sm"><thead><tr style={tableHeadStyle}>
            {paymentHeadings.map(([heading, visibility, right]) => <th key={heading} className={`${headCell} ${visibility} ${right ? 'text-right' : 'text-left'}`}>{heading}</th>)}
          </tr></thead><tbody>
            {sortedPayments.map(payment => {
              const date = shortDate(payment.paidAt)
              const canEdit = canManage && !isCancelled && payment.status !== 'Cancelled'
              return <tr key={payment.id} className="table-row">
                <td className={`${cellFirst} py-3.5 ${cellMain}`}>
                  <Link to={`/loans/${loan.id}/payments/${payment.id}`} aria-label={`Ver abono del ${date}`} className={`${mainLink} mono text-xs`}>{date}</Link>
                  <p className={subMobile}><span>{methodLabel[payment.paymentMethod]}</span><Badge status={payment.status.toLowerCase()} /></p>
                </td>
                <td className={`${cell} py-3.5 ${cellAmount} text-[#0c1a12]`}>{formatCurrency(payment.amount)}</td>
                <td className={`${cell} ${colTablet} py-3.5 text-[#4e7460]`}>{methodLabel[payment.paymentMethod]}</td>
                <td className={`${cell} ${colTablet} py-3.5`}><Badge status={payment.status.toLowerCase()} /></td>
                <td className={`${cellLast} py-3.5 ${cellActions}`}><div className="flex justify-end gap-1">
                  <button onClick={() => navigate(`/loans/${loan.id}/payments/${payment.id}`)} className={eyeButton} aria-label={`Ver abono del ${date}`}><Icon.Eye open /></button>
                  {canEdit && <button onClick={() => openPayment(payment)} className={iconButton} aria-label={`Editar abono del ${date}`}><Icon.Edit /></button>}
                  {canEdit && <button onClick={() => { if (window.confirm(paymentConfirm(payment))) void cancel('payment', payment.id) }} className={dangerButton} aria-label={`Anular abono del ${date}`}><Icon.Trash /></button>}
                </div></td>
              </tr>
            })}
          </tbody></table></div>}
      </section>

      <section aria-labelledby="loan-interests-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: '#eef4f0' }}>
          <h2 id="loan-interests-title" className="text-sm font-semibold text-[#0c1a12]">Intereses <span className="text-[#4e7460] font-normal">({activeInterestCount})</span></h2>
          {canManage && !isCancelled && <button onClick={() => openInterest(null)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Registrar interés</button>}
        </div>
        {sortedInterests.length === 0
          ? <div className="px-5 py-10 text-center text-sm text-[#4e7460]"><p>Aún no hay intereses registrados.</p></div>
          : <div className={tableScroll}><table className="w-full text-sm"><thead><tr style={tableHeadStyle}>
            {interestHeadings.map(([heading, visibility, right]) => <th key={heading} className={`${headCell} ${visibility} ${right ? 'text-right' : 'text-left'}`}>{heading}</th>)}
          </tr></thead><tbody>
            {sortedInterests.map(interest => {
              const cancelled = interest.status === 'Cancelled'
              const path = `/loans/${loan.id}/interest-payments/${interest.id}`
              return <tr key={interest.id} className="table-row">
                <td className={`${cellFirst} py-3.5 ${cellMain}`}>
                  <Link to={path} title={interest.description} className={mainLink}>{interest.description}</Link>
                  <p className={subMobile}><span className="mono">{shortDate(interest.createdAt)}</span><Badge status={interest.status.toLowerCase()} /></p>
                  <p className={subTablet}><span className="whitespace-nowrap">Registrado {shortDate(interest.createdAt)}</span><span className="whitespace-nowrap">· Pagado {interest.paidAt ? shortDate(interest.paidAt) : '—'}</span></p>
                </td>
                <td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap`}>{shortDate(interest.createdAt)}</td>
                <td className={`${cell} py-3.5 ${cellAmount} text-[#0c1a12]`}>{formatCurrency(interest.amount)}</td>
                <td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap`}>{interest.paidAt ? shortDate(interest.paidAt) : '—'}</td>
                <td className={`${cell} ${colTablet} py-3.5`}><Badge status={interest.status.toLowerCase()} /></td>
                <td className={`${cellLast} py-3.5 ${cellActions}`}><div className="flex justify-end gap-1">
                  <button onClick={() => navigate(path)} className={eyeButton} aria-label={`Ver interés «${interest.description}»`}><Icon.Eye open /></button>
                  {canManage && !cancelled && !isCancelled && <button onClick={() => openInterest(interest)} className={iconButton} aria-label={`Editar interés «${interest.description}»`}><Icon.Edit /></button>}
                  {canManage && !cancelled && <button onClick={() => { if (window.confirm(interestConfirm(interest))) void cancel('interest', interest.id) }} className={dangerButton} aria-label={`Anular interés «${interest.description}»`}><Icon.Trash /></button>}
                </div></td>
              </tr>
            })}
          </tbody></table></div>}
      </section>

      <section aria-labelledby="loan-info-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b" style={{ borderColor: '#eef4f0' }}>
          <h2 id="loan-info-title" className="text-sm font-semibold text-[#4e7460]">Detalles del préstamo</h2>
        </div>
        <dl className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {info.map(([label, value]) => <div key={label} className="border-b border-[#eef4f0] pb-3"><dt className="text-xs text-[#4e7460] mb-1">{label}</dt><dd className="text-sm text-[#0c1a12] break-words">{value}</dd></div>)}
        </dl>
      </section>
    </div>

    {modal && <Modal title={modal === 'payment' ? (editingPayment ? 'Editar abono' : 'Registrar abono') : (editingInterest ? 'Editar interés' : 'Registrar interés')} onClose={() => !saving && setModal(null)}><form noValidate onSubmit={event => { event.preventDefault(); void save() }} className="space-y-4">
      <div><label htmlFor="loan-movement-amount" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto</label><MoneyInput id="loan-movement-amount" value={amount} onChange={setAmount} placeholder="50000" />
        {modal === 'payment' && <p className="text-xs text-[#4e7460] mt-1">Capital pendiente: {formatCurrency(maxPayment)}</p>}</div>
      {modal === 'payment' && <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Método de pago</label><select value={method} onChange={event => setMethod(event.target.value as PaymentMethod)} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="Cash">Efectivo</option><option value="Transfer">Transferencia</option></select></div>}
      {modal === 'interest' && <>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Descripción</label><input type="text" maxLength={200} value={description} onChange={event => setDescription(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <StatusRadioGroup name="interest-status" legend="Estado" value={interestStatus} onChange={setInterestStatus} options={[{ value: 'Pending', badge: 'pending', hint: 'Aún no entra a la caja', disabled: editingInterest?.status === 'Paid' }, { value: 'Paid', badge: 'paid', hint: 'Registra el ingreso en la caja' }]} note={editingInterest?.status === 'Paid' ? 'Un interés pagado no puede volver a pendiente.' : undefined} />
      </>}
      <FormError message={modalError} revision={submitCount} />
      <div className="flex gap-3 pt-1"><button type="button" onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </form></Modal>}
  </div>
}
