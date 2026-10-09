import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cancelActivity, createActivity, getActivities, updateActivity, type ActivityListItem } from '@/features/activities/api/activitiesApi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatDateOnly, toDateInput } from '@/features/loans/model/labels'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

interface ActivityForm { name: string, description: string, quantity: string, unitCost: string, unitSalePrice: string, startDate: string }
const emptyForm: ActivityForm = { name: '', description: '', quantity: '', unitCost: '', unitSalePrice: '', startDate: '' }

export function ActivitiesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const canManage = session?.user.role === 'Admin'
  const [activities, setActivities] = useState<ActivityListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<ActivityListItem | null>(null)
  const [form, setForm] = useState<ActivityForm>(emptyForm)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!session) return
    try { setActivities(await getActivities(session.accessToken)); setError(null) }
    catch (requestError) { setError(getFriendlyApiError(requestError)) }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalError(null); setSuccess(null); setError(null); setModal('create') }
  const openEdit = (activity: ActivityListItem) => {
    setEditing(activity)
    setForm({
      name: activity.name, description: activity.description, quantity: String(activity.quantity), unitCost: String(activity.unitCost),
      unitSalePrice: String(activity.unitSalePrice), startDate: toDateInput(activity.startDate),
    })
    setModalError(null); setSuccess(null); setError(null); setModal('edit')
  }

  const save = async () => {
    const quantity = Number(form.quantity)
    const unitCost = Number(form.unitCost)
    const unitSalePrice = Number(form.unitSalePrice)
    if (!form.name.trim()) return setModalError('Ingresa el nombre de la actividad.')
    if (!form.description.trim()) return setModalError('Ingresa una descripción.')
    if (form.quantity === '' || !Number.isInteger(quantity) || quantity < 1) return setModalError('Ingresa una cantidad válida (número entero mayor que cero).')
    if (!Number.isFinite(unitCost) || unitCost <= 0) return setModalError('Ingresa un costo unitario válido.')
    if (!Number.isFinite(unitSalePrice) || unitSalePrice <= 0) return setModalError('Ingresa un precio de venta válido.')
    if (unitSalePrice < unitCost) return setModalError('El precio de venta debe ser mayor o igual al costo unitario.')
    if (!form.startDate) return setModalError('Selecciona la fecha de inicio.')
    if (editing && quantity < editing.assignedQuantity) return setModalError(`La cantidad no puede ser menor a las unidades ya asignadas (${editing.assignedQuantity}).`)
    if (!session) return
    setSaving(true); setModalError(null)
    try {
      const request = { name: form.name.trim(), description: form.description.trim(), quantity, unitCost, unitSalePrice, startDate: form.startDate }
      if (editing) await updateActivity(session.accessToken, editing.id, request)
      else await createActivity(session.accessToken, request)
      setModal(null)
      setSuccess(editing ? 'La actividad se actualizó correctamente.' : 'La actividad se registró correctamente.')
      await load()
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }

  const cancel = async (activity: ActivityListItem) => {
    if (!session) return
    setSuccess(null); setError(null)
    try {
      await cancelActivity(session.accessToken, activity.id)
      setSuccess('La actividad se anuló correctamente.')
      await load()
    } catch (requestError) { setError(getFriendlyApiError(requestError)) }
  }

  const headings = ['Actividad', 'Fecha de inicio', 'Unidades asignadas', 'Disponibles', 'Costo total', 'Precio de venta', 'Estado', 'Acciones']
  const rightHeadings = ['Costo total', 'Precio de venta', 'Acciones']
  const setField = (field: keyof ActivityForm, value: string) => setForm(current => ({ ...current, [field]: value }))

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Actividades</h1><p className="text-[#4e7460] text-sm">Gestiona las actividades de venta de la natillera</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Nueva actividad</button>}
      </div>
      {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
          {headings.map(heading => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${rightHeadings.includes(heading) ? 'text-right' : 'text-left'}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#4e7460]">Cargando actividades...</td></tr>}
          {!loading && activities.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#4e7460]">No hay actividades registradas</td></tr>}
          {!loading && activities.map(activity => <tr key={activity.id} className="table-row">
            <td className="px-5 py-3.5"><span className="font-medium text-[#0c1a12]">{activity.name}</span><p className="text-xs text-[#4e7460] truncate max-w-[220px]">{activity.description}</p></td>
            <td className="px-4 py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap">{formatDateOnly(activity.startDate)}</td>
            <td className="px-4 py-3.5 mono text-[#4e7460]">{`${activity.assignedQuantity} de ${activity.quantity}`}</td>
            <td className="px-4 py-3.5 mono text-[#4e7460]">{activity.availableQuantity}</td>
            <td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(activity.totalCost)}</td>
            <td className="px-4 py-3.5 text-right mono text-[#0c1a12]">{formatCurrency(activity.unitSalePrice)}</td>
            <td className="px-4 py-3.5"><Badge status={activity.status.toLowerCase()} /></td>
            <td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1">
              <button onClick={() => navigate(`/activities/${activity.id}`)} className="btn-ghost p-1.5 rounded-md" aria-label="Ver detalle de la actividad"><Icon.Eye open /></button>
              {canManage && activity.status !== 'Cancelled' && <button onClick={() => openEdit(activity)} className="btn-ghost p-1.5 rounded-md" aria-label="Editar actividad"><Icon.Edit /></button>}
              {canManage && activity.status !== 'Cancelled' && activity.assignedQuantity === 0 && <button onClick={() => { if (window.confirm(`¿Anular la actividad "${activity.name}"? La actividad y su egreso quedarán anulados.`)) void cancel(activity) }} className="btn-danger p-1.5 rounded-md" aria-label="Anular actividad"><Icon.Trash /></button>}
            </div></td>
          </tr>)}
        </tbody></table></div>
      </div>
      {modal && <Modal title={editing ? 'Editar actividad' : 'Nueva actividad'} onClose={() => !saving && setModal(null)}><div className="space-y-4">
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Nombre</label><input type="text" maxLength={100} value={form.name} onChange={event => setField('name', event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Descripción</label><input type="text" maxLength={200} value={form.description} onChange={event => setField('description', event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Cantidad</label><input type="number" min="1" step="1" value={form.quantity} onChange={event => setField('quantity', event.target.value)} placeholder="100" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Costo unitario</label><input type="number" min="0.01" step="0.01" value={form.unitCost} onChange={event => setField('unitCost', event.target.value)} placeholder="5000" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Precio de venta unitario</label><input type="number" min="0.01" step="0.01" value={form.unitSalePrice} onChange={event => setField('unitSalePrice', event.target.value)} placeholder="8000" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Fecha de inicio</label><input type="date" value={form.startDate} onChange={event => setField('startDate', event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        {modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}
        <div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
      </div></Modal>}
    </div>
  )
}
