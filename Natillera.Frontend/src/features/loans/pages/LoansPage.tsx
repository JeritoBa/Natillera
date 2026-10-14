import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cancelLoan, createLoan, getLoans, updateLoan, type LoanListItem } from '@/features/loans/api/loansApi'
import { formatDateOnly, toDateInput } from '@/features/loans/model/labels'
import { useMembers } from '@/features/members/hooks/useMembers'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'
import { toMoneyInputValue } from '@/shared/lib/money'
import { MoneyInput } from '@/shared/ui/MoneyInput'

interface LoanForm { borrowerId: string, initialAmount: string, interestRate: string, startDate: string }
const emptyForm: LoanForm = { borrowerId: '', initialAmount: '', interestRate: '', startDate: '' }
const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
const iconButton = 'btn-ghost p-2 rounded-md min-w-10 min-h-10 inline-flex items-center justify-center'
const dangerButton = 'btn-danger p-2 rounded-md min-w-10 min-h-10 inline-flex items-center justify-center'

export function LoansPage() {
  const { session, isDemo } = useAuth()
  const { members } = useMembers()
  const navigate = useNavigate()
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
  const [month, setMonth] = useState<'all' | string>('all')

  const load = useCallback(async () => {
    if (!session) return
    try { setLoans(await getLoans(session.accessToken)); setError(null) }
    catch (requestError) { setError(getFriendlyApiError(requestError)) }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalError(null); setSuccess(null); setError(null); setModal('create') }
  const openEdit = (loan: LoanListItem) => {
    setEditing(loan)
    setForm({ borrowerId: loan.borrowerId, initialAmount: toMoneyInputValue(loan.initialAmount), interestRate: String(loan.interestRate), startDate: toDateInput(loan.startDate) })
    setModalError(null); setSuccess(null); setError(null); setModal('edit')
  }

  const save = async () => {
    const initialAmount = Number(form.initialAmount)
    const interestRate = Number(form.interestRate)
    if (!form.borrowerId) return setModalError('Selecciona un deudor.')
    if (!Number.isFinite(initialAmount) || initialAmount <= 0) return setModalError('Ingresa un monto inicial válido.')
    if (form.interestRate === '' || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) return setModalError('Ingresa una tasa de interés válida.')
    if (!form.startDate) return setModalError('Selecciona la fecha de inicio.')
    if (!session) return
    setSaving(true); setModalError(null)
    try {
      const request = { borrowerId: form.borrowerId, initialAmount, interestRate, startDate: form.startDate }
      if (editing) await updateLoan(session.accessToken, editing.id, request)
      else await createLoan(session.accessToken, request)
      setModal(null)
      setSuccess(editing ? 'El préstamo se actualizó correctamente.' : 'El préstamo se registró correctamente.')
      await load()
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }

  const cancel = async (loan: LoanListItem) => {
    if (!session) return
    setSuccess(null); setError(null)
    try {
      await cancelLoan(session.accessToken, loan.id)
      setSuccess('El préstamo se anuló correctamente.')
      await load()
    } catch (requestError) { setError(getFriendlyApiError(requestError)) }
  }

  const borrowers = members.filter(member => editing ? member.isActive || member.id === editing.borrowerId : member.isActive)
  const monthOf = (loan: LoanListItem) => loan.startDate.slice(0, 7)
  const monthCounts = new Map<string, number>()
  loans.forEach(loan => monthCounts.set(monthOf(loan), (monthCounts.get(monthOf(loan)) ?? 0) + 1))
  const months = [...monthCounts.keys()].sort().reverse()
  const effectiveMonth = month !== 'all' && monthCounts.has(month) ? month : 'all'
  const filtered = effectiveMonth === 'all' ? loans : loans.filter(loan => monthOf(loan) === effectiveMonth)
  const monthText = (key: string) => `${formatMonth(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`
  const columns: [string, string, boolean][] = [
    ['Deudor', '', false], ['Monto inicial', 'hidden sm:table-cell', true], ['Tasa', 'hidden md:table-cell', false], ['Fecha de inicio', 'hidden sm:table-cell', false],
    ['Capital pendiente', '', true], ['Estado', 'hidden sm:table-cell', false], ['Acciones', 'w-px whitespace-nowrap', true],
  ]

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Préstamos</h1><p className="text-[#4e7460] text-sm">{canManage ? 'Gestiona los créditos internos de la natillera' : 'Créditos internos de la natillera'}</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Nuevo préstamo</button>}
      </div>
      {success && !isDemo && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      {error && loans.length === 0 && !loading && <button onClick={() => { setLoading(true); void load() }} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3 mb-4">Reintentar</button>}
      {!loading && !error && loans.length > 0 && <div className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3" style={cardStyle}>
        <div>
          <label htmlFor="loan-month-filter" className="block text-xs text-[#4e7460] mb-1">Mes de inicio</label>
          <select id="loan-month-filter" value={effectiveMonth} onChange={event => setMonth(event.target.value)} className="w-full sm:w-64 px-3 py-2.5 rounded-lg text-sm">
            <option value="all">Todos los meses</option>
            {months.map(key => <option key={key} value={key}>{`${monthText(key)} (${monthCounts.get(key)})`}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-[#4e7460]" aria-live="polite">Mostrando {filtered.length} de {loans.length} préstamos</p>
          {effectiveMonth !== 'all' && <button onClick={() => setMonth('all')} className="btn-ghost px-3 min-h-10 rounded-lg text-xs">Ver todos los meses</button>}
        </div>
      </div>}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
          {columns.map(([heading, visibility, right]) => <th key={heading} className={`px-3 sm:px-5 py-3 text-[#4e7460] text-xs font-medium ${right ? 'text-right' : 'text-left'} ${visibility}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]"><p role="status">Cargando préstamos…</p></td></tr>}
          {!loading && !error && loans.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">{canManage ? 'Aún no hay préstamos registrados. Usa «Nuevo préstamo» para crear el primero.' : 'Aún no hay préstamos registrados.'}</td></tr>}
          {!loading && loans.length > 0 && filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">
            <p>No hay préstamos que inicien en {monthText(effectiveMonth)}.</p>
            <button onClick={() => setMonth('all')} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Ver todos los meses</button>
          </td></tr>}
          {!loading && filtered.map(loan => <tr key={loan.id} className="table-row">
            <td className="px-3 sm:px-5 py-3.5"><Link to={`/loans/${loan.id}`} className="sm:pointer-events-none font-medium text-[#0c1a12] hover:underline sm:hover:no-underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">{loan.borrowerName}</Link><p className="text-xs text-[#4e7460] sm:hidden mt-0.5 flex items-center gap-1.5 flex-wrap"><span className="mono">{formatCurrency(loan.initialAmount)} · Inicia {formatDateOnly(loan.startDate)}</span><Badge status={loan.status.toLowerCase()} /></p></td>
            <td className="px-4 py-3.5 text-right mono text-[#0c1a12] hidden sm:table-cell">{formatCurrency(loan.initialAmount)}</td>
            <td className="px-4 py-3.5 mono text-[#4e7460] hidden md:table-cell">{loan.interestRate}%</td>
            <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap hidden sm:table-cell">{formatDateOnly(loan.startDate)}</td>
            <td className={`px-3 sm:px-4 py-3.5 text-right whitespace-nowrap ${loan.status === 'Cancelled' ? 'text-[#4e7460]' : loan.outstandingPrincipal > 0 ? 'mono font-semibold text-[#0c1a12]' : 'mono text-[#4e7460]'}`}>{loan.status === 'Cancelled' ? '—' : formatCurrency(loan.outstandingPrincipal)}</td>
            <td className="px-4 py-3.5 hidden sm:table-cell"><Badge status={loan.status.toLowerCase()} /></td>
            <td className="px-3 sm:px-5 py-3.5 text-right w-px whitespace-nowrap"><div className="flex justify-end gap-1">
              <button onClick={() => navigate(`/loans/${loan.id}`)} className={`btn-ghost p-2 rounded-md min-w-10 min-h-10 hidden sm:inline-flex items-center justify-center`} aria-label={`Ver préstamo de ${loan.borrowerName}`}><Icon.Eye open /></button>
              {canManage && loan.status === 'Active' && loan.outstandingPrincipal === loan.initialAmount && <>
                <button onClick={() => openEdit(loan)} className={iconButton} aria-label={`Editar préstamo de ${loan.borrowerName}`}><Icon.Edit /></button>
                <button onClick={() => { if (window.confirm(`¿Anular el préstamo de ${loan.borrowerName} por ${formatCurrency(loan.initialAmount)}? El préstamo y su desembolso quedarán anulados.`)) void cancel(loan) }} className={dangerButton} aria-label={`Anular préstamo de ${loan.borrowerName}`}><Icon.Trash /></button>
              </>}
            </div></td>
          </tr>)}
        </tbody></table>
      </div>
      {modal && <Modal title={editing ? 'Editar préstamo' : 'Nuevo préstamo'} onClose={() => !saving && setModal(null)}><div className="space-y-4">
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Deudor</label><select value={form.borrowerId} onChange={event => setForm(current => ({ ...current, borrowerId: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un deudor</option>{borrowers.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div>
        <div><label htmlFor="loan-initial-amount" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto inicial</label><MoneyInput id="loan-initial-amount" value={form.initialAmount} onChange={value => setForm(current => ({ ...current, initialAmount: value }))} placeholder="500000" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Tasa de interés (%)</label><input type="number" min="0" max="100" step="0.01" value={form.interestRate} onChange={event => setForm(current => ({ ...current, interestRate: event.target.value }))} placeholder="2" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Fecha de inicio</label><input type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        {modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}
        <div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
      </div></Modal>}
    </div>
  )
}
