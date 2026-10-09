import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  cancelActivityAssignment, createActivityAssignment, getActivityDetail, updateActivityAssignment,
  type ActivityAssignmentResponse, type ActivityDetail,
} from '@/features/activities/api/activitiesApi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatDateOnly } from '@/features/loans/model/labels'
import { useMembers } from '@/features/members/hooks/useMembers'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

const card = { background: '#fff', border: '1px solid #d6e8dc' }
const cell = (label: string, value: ReactNode) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><div className="text-sm text-[#0c1a12] break-words">{value}</div></div>
const header = (headings: string[], rightIndexes: number[]) => <thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>{headings.map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${rightIndexes.includes(index) ? 'text-right' : 'text-left'}`}>{heading}</th>)}</tr></thead>

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { members } = useMembers()
  const canManage = session?.user.role === 'Admin'
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<ActivityAssignmentResponse | null>(null)
  const [userId, setUserId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Pending')
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!session || !id) return
    try { setActivity(await getActivityDetail(session.accessToken, id)); setError(null) }
    catch (requestError) {
      setError(requestError instanceof ApiError && requestError.status === 404 ? 'No se encontró la actividad solicitada.' : getFriendlyApiError(requestError))
    }
  }, [id, session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  if (error && !activity) return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/activities')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a actividades</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!activity) return <div className="p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const isCancelled = activity.status === 'Cancelled'
  const available = editing ? activity.availableQuantity + editing.quantityAssigned : activity.availableQuantity
  const assignedUserIds = new Set(activity.assignments.filter(item => item.status !== 'Cancelled').map(item => item.userId))
  const selectableMembers = members.filter(member => member.isActive && !assignedUserIds.has(member.id))
  const sumBy = (target: 'Pending' | 'Paid') => activity.assignments.filter(item => item.status === target).reduce((total, item) => total + item.saleAmount, 0)

  const openModal = (assignment: ActivityAssignmentResponse | null) => {
    setEditing(assignment); setUserId(assignment?.userId ?? ''); setQuantity(assignment ? String(assignment.quantityAssigned) : '')
    setStatus(assignment?.status === 'Paid' ? 'Paid' : 'Pending'); setModalError(null); setSuccess(null); setActionError(null); setModal(true)
  }
  const save = async () => {
    const numericQuantity = Number(quantity)
    if (!editing && !userId) return setModalError('Selecciona un miembro.')
    if (quantity === '' || !Number.isInteger(numericQuantity) || numericQuantity < 1) return setModalError('Ingresa una cantidad válida (número entero mayor que cero).')
    if (numericQuantity > available) return setModalError(`Solo hay ${available} unidades disponibles.`)
    if (!session) return
    setSaving(true); setModalError(null)
    try {
      if (editing) {
        await updateActivityAssignment(session.accessToken, activity.id, editing.id, { quantityAssigned: numericQuantity, status })
        setSuccess(status === 'Paid' ? 'La asignación se marcó como pagada.' : 'La asignación se actualizó correctamente.')
      } else {
        await createActivityAssignment(session.accessToken, activity.id, { userId, quantityAssigned: numericQuantity })
        setSuccess('El miembro se asignó correctamente.')
      }
      setModal(false)
      await load()
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }
  const cancel = async (assignment: ActivityAssignmentResponse) => {
    if (!session) return
    setSuccess(null); setActionError(null)
    try {
      await cancelActivityAssignment(session.accessToken, activity.id, assignment.id)
      setSuccess('La asignación se anuló correctamente.')
      await load()
    } catch (requestError) { setActionError(getFriendlyApiError(requestError)) }
  }

  const fields: [string, ReactNode][] = [
    ['Nombre', activity.name], ['Descripción', activity.description], ['Fecha de inicio', formatDateOnly(activity.startDate)], ['Estado', <Badge status={activity.status.toLowerCase()} />],
    ['Cantidad total', activity.quantity], ['Costo unitario', formatCurrency(activity.unitCost)], ['Precio de venta unitario', formatCurrency(activity.unitSalePrice)],
    ['Fecha de creación', new Date(activity.createdAt).toLocaleString('es-CO')],
  ]
  const stats: [string, string, boolean][] = [
    ['Costo total', formatCurrency(activity.totalCost), false], ['Unidades asignadas', `${activity.assignedQuantity} de ${activity.quantity}`, false],
    ['Por cobrar', formatCurrency(sumBy('Pending')), false], ['Recaudado', formatCurrency(sumBy('Paid')), true],
  ]
  const confirmMessage = (assignment: ActivityAssignmentResponse) => assignment.status === 'Paid'
    ? `¿Anular la asignación pagada de ${assignment.memberName}? La asignación y su ingreso quedarán anulados.`
    : `¿Anular la asignación de ${assignment.memberName}? La asignación quedará anulada.`

  return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/activities')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a actividades</button><div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de actividad</h1><p className="text-[#4e7460] text-sm">Información, resumen y asignaciones de la actividad</p></div>
    {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
    {(actionError || error) && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{actionError ?? error}</p>}
    <div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{fields.map(([label, value]) => cell(label, value))}</div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-6">{stats.map(([label, value, highlight]) => <div key={label} className="stat-card rounded-xl p-4" style={highlight ? { border: '1px solid #0c5c38' } : undefined}><p className="text-[#4e7460] text-xs mb-3">{label}</p><p className={`text-xl font-bold mono ${highlight ? 'text-[#0a6635]' : 'text-[#0c1a12]'}`}>{value}</p></div>)}</div>
    <div className="flex items-center justify-between mt-6 mb-3 gap-4 flex-wrap"><h2 className="text-sm font-bold text-[#0c1a12]">Asignaciones</h2>{canManage && !isCancelled && activity.availableQuantity > 0 && <button onClick={() => openModal(null)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Asignar miembro</button>}</div>
    <div className="rounded-xl overflow-hidden" style={card}><div className="overflow-x-auto"><table className="w-full text-sm">{header(['Miembro', 'Cantidad', 'Valor de venta', 'Fecha de asignación', 'Fecha de pago', 'Estado', 'Acciones'], [2, 6])}<tbody>
      {activity.assignments.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#4e7460]">Esta actividad no tiene asignaciones registradas</td></tr>}
      {activity.assignments.map(assignment => <tr key={assignment.id} className="table-row">
        <td className="px-5 py-3.5 font-medium text-[#0c1a12]">{assignment.memberName}</td>
        <td className="px-4 py-3.5 mono text-[#4e7460]">{assignment.quantityAssigned}</td>
        <td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(assignment.saleAmount)}</td>
        <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{new Date(assignment.assignedAt).toLocaleDateString('es-CO')}</td>
        <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{assignment.paidAt ? new Date(assignment.paidAt).toLocaleDateString('es-CO') : '—'}</td>
        <td className="px-4 py-3.5"><Badge status={assignment.status.toLowerCase()} /></td>
        <td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1">
          <button onClick={() => navigate(`/activities/${activity.id}/assignments/${assignment.id}`)} className="btn-ghost p-1.5 rounded-md" aria-label="Ver detalle"><Icon.Eye open /></button>
          {canManage && !isCancelled && assignment.status === 'Pending' && <button onClick={() => openModal(assignment)} className="btn-ghost p-1.5 rounded-md" aria-label="Editar asignación"><Icon.Edit /></button>}
          {canManage && !isCancelled && assignment.status !== 'Cancelled' && <button onClick={() => { if (window.confirm(confirmMessage(assignment))) void cancel(assignment) }} className="btn-danger p-1.5 rounded-md" aria-label="Anular asignación"><Icon.Trash /></button>}
        </div></td>
      </tr>)}
    </tbody></table></div></div>
    {modal && <Modal title={editing ? 'Editar asignación' : 'Asignar miembro'} onClose={() => !saving && setModal(false)}><div className="space-y-4">
      {editing
        ? <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Miembro</label><p className="text-sm text-[#0c1a12]">{editing.memberName}</p></div>
        : <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Miembro</label><select value={userId} onChange={event => setUserId(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="">Selecciona un miembro</option>{selectableMembers.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div>}
      <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Cantidad</label><input type="number" min="1" step="1" max={available} value={quantity} onChange={event => setQuantity(event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /><p className="text-xs text-[#4e7460] mt-1">Unidades disponibles: {available}</p></div>
      {editing && <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Estado</label><select value={status} onChange={event => setStatus(event.target.value as 'Pending' | 'Paid')} className="w-full px-3 py-2.5 rounded-lg text-sm"><option value="Pending">Pendiente</option><option value="Paid">Pagado</option></select></div>}
      {modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}
      <div className="flex gap-3 pt-1"><button onClick={() => setModal(false)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </div></Modal>}
  </div>
}
