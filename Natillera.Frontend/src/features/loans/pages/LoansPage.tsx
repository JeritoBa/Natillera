import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cancelLoan, createLoan, getLoans, updateLoan, type LoanListItem } from '@/features/loans/api/loansApi'
import { formatDateOnly, toDateInput } from '@/features/loans/model/labels'
import { useMembers } from '@/features/members/hooks/useMembers'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

interface LoanForm { borrowerId: string, initialAmount: string, interestRate: string, startDate: string }
const emptyForm: LoanForm = { borrowerId: '', initialAmount: '', interestRate: '', startDate: '' }

export function LoansPage() {
  const { session } = useAuth()
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
    setForm({ borrowerId: loan.borrowerId, initialAmount: String(loan.initialAmount), interestRate: String(loan.interestRate), startDate: toDateInput(loan.startDate) })
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

  const headings = ['Deudor', 'Monto inicial', 'Tasa', 'Fecha de inicio', 'Capital pendiente', 'Estado', 'Acciones']
  const rightHeadings = ['Monto inicial', 'Capital pendiente', 'Acciones']
  const borrowers = members.filter(member => editing ? member.isActive || member.id === editing.borrowerId : member.isActive)

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Préstamos</h1><p className="text-[#4e7460] text-sm">Gestiona los créditos internos de la natillera</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Nuevo préstamo</button>}
      </div>
      {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
          {headings.map(heading => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${rightHeadings.includes(heading) ? 'text-right' : 'text-left'}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">Cargando préstamos...</td></tr>}
          {!loading && loans.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">No hay préstamos registrados</td></tr>}
          {!loading && loans.map(loan => <tr key={loan.id} className="table-row">
            <td className="px-5 py-3.5"><span className="font-medium text-[#0c1a12]">{loan.borrowerName}</span></td>
            <td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(loan.initialAmount)}</td>
            <td className="px-4 py-3.5 mono text-[#4e7460]">{loan.interestRate}%</td>
            <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{formatDateOnly(loan.startDate)}</td>
            <td className={`px-4 py-3.5 text-right mono font-semibold ${loan.outstandingPrincipal > 0 ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{formatCurrency(loan.outstandingPrincipal)}</td>
            <td className="px-4 py-3.5"><Badge status={loan.status.toLowerCase()} /></td>
            <td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1">
              <button onClick={() => navigate(`/loans/${loan.id}`)} className="btn-ghost p-1.5 rounded-md" aria-label="Ver detalle del préstamo"><Icon.Eye open /></button>
              {canManage && loan.status !== 'Cancelled' && <>
                <button onClick={() => openEdit(loan)} className="btn-ghost p-1.5 rounded-md" aria-label="Editar préstamo"><Icon.Edit /></button>
                <button onClick={() => { if (window.confirm(`¿Anular el préstamo de ${loan.borrowerName}? El préstamo quedará anulado.`)) void cancel(loan) }} className="btn-danger p-1.5 rounded-md" aria-label="Anular préstamo"><Icon.Trash /></button>
              </>}
            </div></td>
          </tr>)}
        </tbody></table></div>
      </div>
      {modal && <Modal title={editing ? 'Editar préstamo' : 'Nuevo préstamo'} onClose={() => !saving && setModal(null)}><div className="space-y-4">
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Deudor</label><select value={form.borrowerId} onChange={event => setForm(current => ({ ...current, borrowerId: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un deudor</option>{borrowers.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Monto inicial</label><input type="number" min="1" step="0.01" value={form.initialAmount} onChange={event => setForm(current => ({ ...current, initialAmount: event.target.value }))} placeholder="500000" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Tasa de interés (%)</label><input type="number" min="0" max="100" step="0.01" value={form.interestRate} onChange={event => setForm(current => ({ ...current, interestRate: event.target.value }))} placeholder="2" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Fecha de inicio</label><input type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        {modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}
        <div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
      </div></Modal>}
    </div>
  )
}
