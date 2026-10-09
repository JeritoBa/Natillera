import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appName } from '@/app/useDocumentTitle'
import {
  cancelActivityAssignment, createActivityAssignment, getActivityDetail, updateActivityAssignment,
  type ActivityAssignmentResponse, type ActivityDetail,
} from '@/features/activities/api/activitiesApi'
import { getActivitySummary } from '@/features/activities/model/activitySummary'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMembers } from '@/features/members/hooks/useMembers'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
const rowClass = 'flex justify-between border-t border-[#eef4f0] pt-2'
const longDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
const statusOrder = { Pending: 0, Paid: 1, Cancelled: 2 }
const iconButton = 'btn-ghost p-2 rounded-md min-w-10 min-h-10 inline-flex items-center justify-center'
const dangerButton = 'btn-danger p-2 rounded-md min-w-10 min-h-10 inline-flex items-center justify-center'
const headings: [string, string, boolean][] = [
  ['Miembro', '', false], ['Unidades', 'hidden sm:table-cell', true], ['Valor de venta', '', true], ['Asignada', 'hidden md:table-cell', false],
  ['Pagada', 'hidden md:table-cell', false], ['Estado', 'hidden sm:table-cell', false], ['Acciones', 'w-px whitespace-nowrap', true],
]

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { members } = useMembers()
  const canManage = session?.user.role === 'Admin'
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
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
  const requestId = useRef(0)

  const load = useCallback(async () => {
    if (!session || !id) return
    const current = ++requestId.current
    setLoading(true); setError(null); setNotFound(false); setActivity(null)
    try {
      const result = await getActivityDetail(session.accessToken, id)
      if (current === requestId.current) setActivity(result)
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
      const result = await getActivityDetail(session.accessToken, id)
      if (current === requestId.current) { setActivity(result); setActionError(null) }
    } catch (requestError) {
      if (current === requestId.current) setActionError(getFriendlyApiError(requestError))
    }
  }, [id, session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (activity) document.title = `${activity.name} · ${appName}`
  }, [activity])

  const back = <button onClick={() => navigate('/activities')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a actividades</button>

  if (loading) return <div className="p-6 lg:p-8 max-w-5xl">{back}<p role="status" className="text-[#4e7460]">Cargando actividad…</p></div>
  if (notFound) return <div className="p-6 lg:p-8 max-w-5xl">{back}
    <div role="alert" className="rounded-xl p-8 text-center" style={cardStyle}>
      <h1 className="text-lg font-bold text-[#0c1a12]">No se encontró la actividad</h1>
      <p className="text-sm text-[#4e7460]">Puede que el enlace esté incompleto o que la actividad no exista.</p>
      <button onClick={() => navigate('/activities')} className="btn-primary px-4 py-2 rounded-lg text-sm mt-4">Ver lista de actividades</button>
    </div>
  </div>
  if (error || !activity) return <div className="p-6 lg:p-8 max-w-5xl">{back}
    <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>
    <button onClick={() => void load()} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3">Reintentar</button>
  </div>

  const isCancelled = activity.status === 'Cancelled'
  const available = editing ? activity.availableQuantity + editing.quantityAssigned : activity.availableQuantity
  const assignedUserIds = new Set(activity.assignments.filter(item => item.status !== 'Cancelled').map(item => item.userId))
  const selectableMembers = members.filter(member => member.isActive && !assignedUserIds.has(member.id))
  const summary = getActivitySummary(activity)
  const { net } = summary
  const sortedAssignments = [...activity.assignments].sort((a, b) =>
    statusOrder[a.status] - statusOrder[b.status] || new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime())
  const activeCount = activity.assignments.filter(item => item.status !== 'Cancelled').length
  const total = activity.quantity
  const percent = (units: number) => `${total > 0 ? Math.max(0, Math.min(100, (units / total) * 100)) : 0}%`

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
      await refresh()
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }
  const cancel = async (assignment: ActivityAssignmentResponse) => {
    if (!session) return
    setSuccess(null); setActionError(null)
    try {
      await cancelActivityAssignment(session.accessToken, activity.id, assignment.id)
      setSuccess('La asignación se anuló correctamente.')
      await refresh()
    } catch (requestError) { setActionError(getFriendlyApiError(requestError)) }
  }

  const info: [string, ReactNode][] = [
    ['Nombre', activity.name], ['Descripción', activity.description], ['Fecha de inicio', longDate(activity.startDate)], ['Estado', <Badge status={activity.status.toLowerCase()} />],
    ['Cantidad total', activity.quantity], ['Costo unitario', formatCurrency(activity.unitCost)], ['Precio de venta unitario', formatCurrency(activity.unitSalePrice)],
    ['Fecha de creación', new Date(activity.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })],
  ]
  const breakdown: [string, ReactNode, string][] = [
    ['Costo total', formatCurrency(activity.totalCost), isCancelled ? 'Anulado: no afecta el saldo' : `${activity.quantity} unidades × ${formatCurrency(activity.unitCost)} c/u`],
    ['Faltante por cobrar', formatCurrency(summary.outstanding), summary.pendingCount > 0 ? `${summary.pendingCount} asignaciones sin pagar` : 'Nada pendiente de cobro'],
    ['Ganancia bruta', isCancelled ? '—' : `${summary.gross < 0 ? '−' : ''}${formatCurrency(summary.gross)}`, isCancelled ? 'No aplica: actividad anulada' : 'Margen de las unidades vendidas y pagadas'],
    ['Recaudado', formatCurrency(summary.collected), `${summary.paidCount} asignaciones pagadas`],
  ]
  const confirmMessage = (assignment: ActivityAssignmentResponse) => assignment.status === 'Paid'
    ? `¿Anular la asignación pagada de ${assignment.memberName}? La asignación y su ingreso quedarán anulados.`
    : `¿Anular la asignación de ${assignment.memberName}? La asignación quedará anulada.`

  return <div className="p-6 lg:p-8 max-w-5xl">
    {back}
    <div className="mb-7">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-[#0c1a12] break-words">{activity.name}</h1>
        <Badge status={activity.status.toLowerCase()} />
      </div>
      <p className="text-[#4e7460] text-sm mt-0.5">Inicia el {longDate(activity.startDate)}</p>
      {isCancelled && <p role="status" className="mt-3 rounded-lg border border-[#d6e8dc] bg-[#eef4f0] px-3 py-2.5 text-sm text-[#4e7460]">Esta actividad está anulada. Su costo ya no cuenta como egreso y no admite cambios.</p>}
    </div>
    {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
    {actionError && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{actionError}</p>}

    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section aria-labelledby="activity-net-title" className="rounded-xl p-5 lg:p-6 text-white lg:col-span-3" style={{ background: '#0c5c38' }}>
          <h2 id="activity-net-title" className="text-sm font-medium text-[#cfe8da]">Ganancia neta</h2>
          <p className="mono font-bold text-3xl md:text-4xl mt-2 break-words">
            {isCancelled ? '—' : net < 0 ? `−${formatCurrency(net)}` : formatCurrency(net)}
          </p>
          <p className="text-sm text-[#cfe8da] mt-2">{isCancelled ? 'No aplica: actividad anulada' : net >= 0 ? 'Lo recaudado menos el costo total' : `Faltan ${formatCurrency(-net)} para cubrir el costo`}</p>
          <div className="border-t border-white/20 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {breakdown.map(([label, value, note]) => <div key={label}>
              <p className="text-xs text-[#cfe8da]">{label}</p>
              <p className="mono text-base font-semibold text-white">{value}</p>
              <p className="text-xs text-[#cfe8da]">{note}</p>
            </div>)}
          </div>
        </section>

        <section aria-labelledby="activity-units-title" className="rounded-xl p-5 lg:col-span-2" style={cardStyle}>
          <h2 id="activity-units-title" className="text-sm font-semibold text-[#0c1a12]">Unidades</h2>
          <p className="mono text-2xl font-bold text-[#0c1a12] mt-2">{activity.quantity}</p>
          <p className="text-xs text-[#4e7460]">unidades en total</p>
          <div aria-hidden="true" className="flex h-2 rounded overflow-hidden bg-[#eef4f0] mt-3">
            <div style={{ width: percent(summary.uPaid), background: '#0c5c38' }} />
            <div style={{ width: percent(summary.uPending), background: '#9a6e00' }} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className={rowClass}><dt className="text-[#0c1a12]"><span aria-hidden="true" className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: '#0c5c38' }} />Pagadas</dt><dd className="mono text-[#0c1a12]">{summary.uPaid}</dd></div>
            <div className={rowClass}><dt className="text-[#0c1a12]"><span aria-hidden="true" className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: '#9a6e00' }} />Asignadas sin pagar</dt><dd className="mono text-[#0c1a12]">{summary.uPending}</dd></div>
            <div className={rowClass}><dt className="text-[#0c1a12]"><span aria-hidden="true" className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: '#eef4f0', border: '1px solid #d6e8dc' }} />Sin asignar</dt><dd className="mono text-[#0c1a12]">{summary.uUnassigned}</dd></div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="activity-assignments-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: '#eef4f0' }}>
          <h2 id="activity-assignments-title" className="text-sm font-semibold text-[#0c1a12]">Asignaciones <span className="text-[#4e7460] font-normal">({activeCount})</span></h2>
          {canManage && !isCancelled && activity.availableQuantity > 0 && <button onClick={() => openModal(null)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Asignar miembro</button>}
          {canManage && !isCancelled && activity.availableQuantity === 0 && <p className="text-xs text-[#4e7460]">Todas las unidades están asignadas</p>}
        </div>
        {sortedAssignments.length === 0
          ? <div className="px-5 py-10 text-center text-sm text-[#4e7460]">
            <p>Aún no hay miembros asignados a esta actividad.</p>
            {canManage && !isCancelled && <p>Usa «Asignar miembro» para repartir las unidades.</p>}
          </div>
          : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
            {headings.map(([heading, visibility, right]) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${right ? 'text-right' : 'text-left'} ${visibility}`}>{heading}</th>)}
          </tr></thead><tbody>
            {sortedAssignments.map(assignment => <tr key={assignment.id} className="table-row">
              <td className="px-5 py-3.5">
                <Link to={`/activities/${activity.id}/assignments/${assignment.id}`} className="font-medium text-[#0c1a12] hover:underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">{assignment.memberName}</Link>
                <p className="sm:hidden text-xs text-[#4e7460] mt-0.5 flex items-center gap-1.5 flex-wrap"><span className="mono">{assignment.quantityAssigned} u.</span><Badge status={assignment.status.toLowerCase()} /></p>
              </td>
              <td className="px-4 py-3.5 text-right mono text-[#4e7460] hidden sm:table-cell">{assignment.quantityAssigned}</td>
              <td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(assignment.saleAmount)}</td>
              <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap hidden md:table-cell">{new Date(assignment.assignedAt).toLocaleDateString('es-CO')}</td>
              <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap hidden md:table-cell">{assignment.paidAt ? new Date(assignment.paidAt).toLocaleDateString('es-CO') : '—'}</td>
              <td className="px-4 py-3.5 hidden sm:table-cell"><Badge status={assignment.status.toLowerCase()} /></td>
              <td className="px-5 py-3.5 text-right w-px whitespace-nowrap"><div className="flex justify-end gap-1">
                <button onClick={() => navigate(`/activities/${activity.id}/assignments/${assignment.id}`)} className={`btn-ghost p-2 rounded-md min-w-10 min-h-10 hidden sm:inline-flex items-center justify-center`} aria-label={`Ver asignación de ${assignment.memberName}`}><Icon.Eye open /></button>
                {canManage && !isCancelled && assignment.status === 'Pending' && <button onClick={() => openModal(assignment)} className={iconButton} aria-label={`Editar asignación de ${assignment.memberName}`}><Icon.Edit /></button>}
                {canManage && !isCancelled && assignment.status !== 'Cancelled' && <button onClick={() => { if (window.confirm(confirmMessage(assignment))) void cancel(assignment) }} className={dangerButton} aria-label={`Anular asignación de ${assignment.memberName}`}><Icon.Trash /></button>}
              </div></td>
            </tr>)}
          </tbody></table></div>}
      </section>

      <section aria-labelledby="activity-info-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b" style={{ borderColor: '#eef4f0' }}>
          <h2 id="activity-info-title" className="text-sm font-semibold text-[#4e7460]">Detalles de la actividad</h2>
        </div>
        <dl className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {info.map(([label, value]) => <div key={label} className="border-b border-[#eef4f0] pb-3"><dt className="text-xs text-[#4e7460] mb-1">{label}</dt><dd className="text-sm text-[#0c1a12] break-words">{value}</dd></div>)}
        </dl>
      </section>
    </div>

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
