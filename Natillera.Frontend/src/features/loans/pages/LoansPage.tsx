import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import { defaultDateForPeriod, isDateInPeriodYear, periodDateBounds } from '@/features/settings/model/savingPeriod'
import { cancelLoan, createLoan, getLoans, updateLoan, type LoanListItem } from '@/features/loans/api/loansApi'
import { descriptionCounterState, isLoanDescriptionValid, LOAN_DESCRIPTION_MAX_LENGTH, normalizeLoanDescription } from '@/features/loans/model/loanDescription'
import { formatDateOnly, toDateInput } from '@/features/loans/model/labels'
import { loanCancelConsequences } from '@/features/loans/model/cancelConfirm'
import { countLoansByStatus, filterLoans, loanBorrowerOptions, loanStartMonth, parseLoanStatusFilter, type LoanStatusFilter } from '@/features/loans/model/loanFilters'
import { useMembers } from '@/features/members/hooks/useMembers'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ConfirmSummary } from '@/shared/ui/ConfirmSummary'
import { Icon } from '@/shared/ui/Icon'
import { FormError } from '@/shared/ui/FormError'
import { Modal } from '@/shared/ui/Modal'
import { toMoneyInputValue } from '@/shared/lib/money'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { cellMain, colDesktop, colTablet, dangerButton, eyeButton, headCell, iconButton, mainLink, subMobile, subTablet, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'

interface LoanForm { borrowerId: string, initialAmount: string, interestRate: string, startDate: string, description: string }
const emptyForm: LoanForm = { borrowerId: '', initialAmount: '', interestRate: '', startDate: '', description: '' }
const counterClass = { normal: 'text-[#4e7460]', near: 'text-[#9a6e00]', limit: 'text-[#c0392b] font-semibold' } as const
const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }

export function LoansPage() {
  const { session, isDemo } = useAuth()
  const { selected } = useSavingPeriod()
  const { members } = useMembers()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const canManage = session?.user.role === 'Admin'
  const [loans, setLoans] = useState<LoanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<LoanListItem | null>(null)
  const [form, setForm] = useState<LoanForm>(emptyForm)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [month, setMonth] = useState<'all' | string>('all')
  const [search, setSearch] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<LoanListItem | null>(null)
  const [focusSuccess, setFocusSuccess] = useState(0)
  const successRef = useRef<HTMLParagraphElement>(null)
  // Spec 021: ?borrower=<userId>&status=Active are read once on load; the URL is not written back.
  const [borrowerFilter, setBorrowerFilter] = useState<'all' | string>(() => searchParams.get('borrower') ?? 'all')
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>(() => parseLoanStatusFilter(searchParams.get('status')))

  const load = useCallback(async () => {
    if (!session) return
    try { setLoans(await getLoans(session.accessToken)); setError(null) }
    catch (requestError) { setError(getFriendlyApiError(requestError)) }
    finally { setLoading(false) }
  }, [session])

  // UI-13: after a cancellation the trigger button disappears, so the focus moves to the success banner.
  useEffect(() => { if (focusSuccess > 0) successRef.current?.focus() }, [focusSuccess])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  // PER-05: the start date must fall inside the period year; an edited loan keeps its own period year.
  const periodYear = editing ? Number(editing.startDate.slice(0, 4)) : selected?.year
  const bounds = periodYear ? periodDateBounds(periodYear) : undefined
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, startDate: selected ? defaultDateForPeriod(selected.year, new Date()) : '' }); setModalError(null); setSuccess(null); setError(null); setModal('create') }
  const openEdit = (loan: LoanListItem) => {
    setEditing(loan)
    setForm({ borrowerId: loan.borrowerId, initialAmount: toMoneyInputValue(loan.initialAmount), interestRate: String(loan.interestRate), startDate: toDateInput(loan.startDate), description: loan.description ?? '' })
    setModalError(null); setSuccess(null); setError(null); setModal('edit')
  }

  const save = async () => {
    if (saving) return
    setSubmitCount(count => count + 1)
    setModalError(null)
    const initialAmount = Number(form.initialAmount)
    const interestRate = Number(form.interestRate)
    if (!form.borrowerId) return setModalError('Selecciona un deudor.')
    if (!Number.isFinite(initialAmount) || initialAmount <= 0) return setModalError('Ingresa un monto inicial válido.')
    if (form.interestRate === '' || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) return setModalError('Ingresa una tasa de interés válida.')
    if (!form.startDate) return setModalError('Selecciona la fecha de inicio.')
    if (periodYear && !isDateInPeriodYear(form.startDate, periodYear)) return setModalError(`La fecha de inicio debe estar dentro de ${periodYear}. Para registrar en otro año, cambia el periodo en Configuración.`)
    if (!isLoanDescriptionValid(form.description)) return setModalError('La descripción no puede superar 500 caracteres.')
    if (!session) return
    setSaving(true); setModalError(null)
    try {
      const request = { borrowerId: form.borrowerId, initialAmount, interestRate, startDate: form.startDate, description: normalizeLoanDescription(form.description) }
      if (editing) await updateLoan(session.accessToken, editing.id, request)
      else await createLoan(session.accessToken, request)
      setModal(null)
      setSuccess(editing ? 'El préstamo se actualizó correctamente.' : 'El préstamo se registró correctamente.')
      await load()
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }

  // UI-13: errors propagate to the confirmation dialog.
  const confirmCancel = async (loan: LoanListItem) => {
    if (!session) return
    await cancelLoan(session.accessToken, loan.id)
    setConfirmTarget(null)
    setSuccess('El préstamo se anuló correctamente.')
    setFocusSuccess(count => count + 1)
    await load()
  }

  const borrowers = members.filter(member => editing ? member.isActive || member.id === editing.borrowerId : member.isActive)
  const monthCounts = new Map<string, number>()
  loans.forEach(loan => monthCounts.set(loanStartMonth(loan), (monthCounts.get(loanStartMonth(loan)) ?? 0) + 1))
  const months = [...monthCounts.keys()].sort().reverse()
  const effectiveMonth = month !== 'all' && monthCounts.has(month) ? month : 'all'
  const borrowerOptions = loanBorrowerOptions(loans)
  const effectiveBorrower = borrowerFilter !== 'all' && borrowerOptions.some(option => option.id === borrowerFilter) ? borrowerFilter : 'all'
  const filtered = filterLoans(loans, search, effectiveMonth, statusFilter, effectiveBorrower)
  const statusCounts = countLoansByStatus(loans)
  const hasFilters = effectiveMonth !== 'all' || search.trim() !== '' || statusFilter !== 'all' || effectiveBorrower !== 'all'
  const clearFilters = () => { setMonth('all'); setSearch(''); setStatusFilter('all'); setBorrowerFilter('all') }
  const monthText = (key: string) => `${formatMonth(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`
  const columns: { heading: ReactNode, key: string, cls: string, right: boolean }[] = [
    { key: 'borrower', heading: 'Deudor', cls: 'px-3 sm:px-5', right: false },
    { key: 'initial', heading: 'Monto inicial', cls: `px-3 sm:px-4 ${colDesktop}`, right: true },
    { key: 'rate', heading: 'Tasa', cls: `px-3 sm:px-4 ${colDesktop}`, right: false },
    { key: 'start', heading: 'Fecha de inicio', cls: `px-3 sm:px-4 ${colDesktop}`, right: false },
    { key: 'principal', heading: <><span className="sm:hidden">Pendiente</span><span className="hidden sm:inline">Capital pendiente</span></>, cls: 'px-3 sm:px-4 whitespace-nowrap', right: true },
    { key: 'status', heading: 'Estado', cls: `px-3 sm:px-4 ${colTablet}`, right: false },
    { key: 'actions', heading: 'Acciones', cls: 'px-3 sm:px-5 w-px whitespace-nowrap', right: true },
  ]
  const col = (key: string) => columns.find(column => column.key === key)?.cls ?? ''

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Préstamos</h1><p className="text-[#4e7460] text-sm">{canManage ? 'Gestiona los créditos internos de la natillera' : 'Créditos internos de la natillera'}{selected ? ` · Periodo ${selected.year}` : ''}</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Nuevo préstamo</button>}
      </div>
      {success && !isDemo && <p ref={successRef} tabIndex={-1} role="status" className="mb-4 outline-none rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      {error && loans.length === 0 && !loading && <button onClick={() => { setLoading(true); void load() }} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3 mb-4">Reintentar</button>}
      {!loading && !error && loans.length > 0 && <div className="rounded-xl p-4 mb-4 space-y-3" style={cardStyle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label htmlFor="loan-search" className="block text-xs text-[#4e7460] mb-1">Buscar deudor</label>
            <input id="loan-search" type="search" autoComplete="off" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre del deudor" className="w-full px-3 py-2.5 rounded-lg text-sm" />
          </div>
          <div>
            <label htmlFor="loan-borrower-filter" className="block text-xs text-[#4e7460] mb-1">Deudor</label>
            <select id="loan-borrower-filter" value={effectiveBorrower} onChange={event => setBorrowerFilter(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="all">Todos los deudores</option>
              {borrowerOptions.map(option => <option key={option.id} value={option.id}>{`${option.name} (${option.count})`}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="loan-month-filter" className="block text-xs text-[#4e7460] mb-1">Mes de inicio</label>
            <select id="loan-month-filter" value={effectiveMonth} onChange={event => setMonth(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="all">Todos los meses</option>
              {months.map(key => <option key={key} value={key}>{`${monthText(key)} (${monthCounts.get(key)})`}</option>)}
            </select>
          </div>
        </div>
        <div role="group" aria-label="Filtrar por estado" className="flex gap-1.5 flex-wrap">
          {([['all', 'Todos'], ['Active', 'Activos'], ['Paid', 'Pagados'], ['Cancelled', 'Anulados']] as const).map(([value, label]) =>
            <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`px-3 min-h-10 rounded-lg text-xs font-medium transition-all ${statusFilter === value ? 'bg-[#0c5c38] text-white' : 'btn-ghost'}`}>{label} ({statusCounts[value]})</button>)}
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#4e7460]" aria-live="polite">Mostrando {filtered.length} de {loans.length} préstamos</p>
          {hasFilters && <button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs">Limpiar filtros</button>}
        </div>
      </div>}
      <div className={tableWrap} style={cardStyle}><div className={tableScroll}>
        <table className="w-full text-sm"><thead><tr style={tableHeadStyle}>
          {columns.map(column => <th key={column.key} className={`${column.cls} ${headCell} ${column.right ? 'text-right' : 'text-left'}`}>{column.heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]"><p role="status">Cargando préstamos…</p></td></tr>}
          {!loading && !error && loans.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">{canManage ? 'Aún no hay préstamos registrados. Usa «Nuevo préstamo» para crear el primero.' : 'Aún no hay préstamos registrados.'}</td></tr>}
          {!loading && loans.length > 0 && filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">
            <p>{search.trim() || statusFilter !== 'all' || effectiveBorrower !== 'all' ? 'No hay préstamos que coincidan con los filtros.' : `No hay préstamos que inicien en ${monthText(effectiveMonth)}.`}</p>
            <button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Limpiar filtros</button>
          </td></tr>}
          {!loading && filtered.map(loan => <tr key={loan.id} className="table-row">
            <td className={`${col('borrower')} py-3.5 ${cellMain}`}>
              <Link to={`/loans/${loan.id}`} title={loan.borrowerName} className={mainLink}>{loan.borrowerName}</Link>
              <p className={subMobile}><span className="mono">Inicia {formatDateOnly(loan.startDate)}</span><Badge status={loan.status.toLowerCase()} /></p>
              <p className={subTablet}><span className="whitespace-nowrap">Prestado <span className="mono">{formatCurrency(loan.initialAmount)}</span></span><span className="whitespace-nowrap">· Tasa {loan.interestRate}%</span><span className="whitespace-nowrap">· Inicia {formatDateOnly(loan.startDate)}</span></p>
            </td>
            <td className={`${col('initial')} py-3.5 text-right mono text-[#0c1a12]`}>{formatCurrency(loan.initialAmount)}</td>
            <td className={`${col('rate')} py-3.5 mono text-[#4e7460]`}>{loan.interestRate}%</td>
            <td className={`${col('start')} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap`}>{formatDateOnly(loan.startDate)}</td>
            <td className={`${col('principal')} py-3.5 text-right ${loan.status === 'Cancelled' ? 'text-[#4e7460]' : loan.outstandingPrincipal > 0 ? 'mono font-semibold text-[#0c1a12]' : 'mono text-[#4e7460]'}`}>{loan.status === 'Cancelled' ? '—' : formatCurrency(loan.outstandingPrincipal)}</td>
            <td className={`${col('status')} py-3.5`}><Badge status={loan.status.toLowerCase()} /></td>
            <td className={`${col('actions')} py-3.5 text-right`}><div className="flex justify-end gap-1">
              <button onClick={() => navigate(`/loans/${loan.id}`)} className={eyeButton} aria-label={`Ver préstamo de ${loan.borrowerName}`}><Icon.Eye open /></button>
              {canManage && loan.status === 'Active' && loan.outstandingPrincipal === loan.initialAmount && <>
                <button onClick={() => openEdit(loan)} className={iconButton} aria-label={`Editar préstamo de ${loan.borrowerName}`}><Icon.Edit /></button>
                <button onClick={() => { setSuccess(null); setError(null); setConfirmTarget(loan) }} className={dangerButton} aria-label={`Anular préstamo de ${loan.borrowerName}`}><Icon.Trash /></button>
              </>}
            </div></td>
          </tr>)}
        </tbody></table>
      </div></div>
      {modal && <Modal title={editing ? 'Editar préstamo' : 'Nuevo préstamo'} onClose={() => !saving && setModal(null)}><form noValidate onSubmit={event => { event.preventDefault(); void save() }} className="space-y-4">
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Deudor</label><select value={form.borrowerId} onChange={event => setForm(current => ({ ...current, borrowerId: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un deudor</option>{borrowers.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div>
        <div><label htmlFor="loan-initial-amount" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto inicial</label><MoneyInput id="loan-initial-amount" value={form.initialAmount} onChange={value => setForm(current => ({ ...current, initialAmount: value }))} placeholder="500000" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Tasa de interés (%)</label><input type="number" min="0" max="100" step="0.01" value={form.interestRate} onChange={event => setForm(current => ({ ...current, interestRate: event.target.value }))} placeholder="2" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label htmlFor="loan-start-date" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Fecha de inicio</label><input id="loan-start-date" type="date" min={bounds?.min} max={bounds?.max} aria-describedby={periodYear ? 'loan-start-date-help' : undefined} value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" />{periodYear && <p id="loan-start-date-help" className="text-xs text-[#4e7460] mt-1.5">Debe ser una fecha de {periodYear}, el periodo seleccionado.</p>}</div>
        <div>
          <label htmlFor="loan-description" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Descripción (opcional)</label>
          <textarea id="loan-description" rows={4} maxLength={LOAN_DESCRIPTION_MAX_LENGTH} aria-describedby="loan-description-help loan-description-count" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Ej.: para arreglo de la moto. Acordó pagar los días 15." className="w-full px-3 py-2.5 rounded-lg text-sm leading-relaxed resize-y min-h-24 max-h-64" />
          <div className="flex items-start justify-between gap-3 mt-1.5">
            <p id="loan-description-help" className="text-xs text-[#4e7460]">Para qué es el préstamo o acuerdos con el deudor. La ven todos los socios.</p>
            <p id="loan-description-count" aria-hidden="true" className={`text-xs mono shrink-0 ${counterClass[descriptionCounterState(form.description.length)]}`}>{form.description.length >= LOAN_DESCRIPTION_MAX_LENGTH ? `${LOAN_DESCRIPTION_MAX_LENGTH}/${LOAN_DESCRIPTION_MAX_LENGTH} · Límite alcanzado` : `${form.description.length}/${LOAN_DESCRIPTION_MAX_LENGTH}`}</p>
          </div>
          {form.description.length >= 450 && <span aria-live="polite" className="sr-only">Te quedan {LOAN_DESCRIPTION_MAX_LENGTH - form.description.length} caracteres</span>}
        </div>
        <FormError message={modalError} revision={submitCount} />
        <div className="flex gap-3 pt-1"><button type="button" onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
      </form></Modal>}
      {confirmTarget && <ConfirmDialog title="Anular préstamo" confirmLabel="Anular préstamo" consequences={loanCancelConsequences()} onClose={() => setConfirmTarget(null)} onConfirm={() => confirmCancel(confirmTarget)}
        summary={<ConfirmSummary title={confirmTarget.borrowerName} detail={`Inicia ${formatDateOnly(confirmTarget.startDate)}`} amount={formatCurrency(confirmTarget.initialAmount)} status={confirmTarget.status.toLowerCase()} />} />}
    </div>
  )
}
