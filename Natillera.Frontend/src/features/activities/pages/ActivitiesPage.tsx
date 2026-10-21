import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cancelActivity, createActivity, getActivities, updateActivity, type ActivityListItem } from '@/features/activities/api/activitiesApi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatDateOnly, toDateInput } from '@/features/loans/model/labels'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'
import { toMoneyInputValue } from '@/shared/lib/money'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { cell, cellActions, cellAmount, cellFirst, cellLast, cellMain, colDesktop, colTablet, dangerButton, eyeButton, headCell, iconButton, mainLink, subMobile, subTablet, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'

interface ActivityForm { name: string, description: string, quantity: string, unitCost: string, unitSalePrice: string, startDate: string }
const emptyForm: ActivityForm = { name: '', description: '', quantity: '', unitCost: '', unitSalePrice: '', startDate: '' }
const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }

export function ActivitiesPage() {
  const { session, isDemo } = useAuth()
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
  const [month, setMonth] = useState<'all' | string>('all')

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
      name: activity.name, description: activity.description, quantity: String(activity.quantity), unitCost: toMoneyInputValue(activity.unitCost),
      unitSalePrice: toMoneyInputValue(activity.unitSalePrice), startDate: toDateInput(activity.startDate),
    })
    setModalError(null); setSuccess(null); setError(null); setModal('edit')
  }

  const save = async () => {
    if (saving) return
    setModalError(null)
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

  const monthOf = (activity: ActivityListItem) => activity.startDate.slice(0, 7)
  const monthCounts = new Map<string, number>()
  activities.forEach(activity => monthCounts.set(monthOf(activity), (monthCounts.get(monthOf(activity)) ?? 0) + 1))
  const months = [...monthCounts.keys()].sort().reverse()
  const effectiveMonth = month !== 'all' && monthCounts.has(month) ? month : 'all'
  const filtered = effectiveMonth === 'all' ? activities : activities.filter(activity => monthOf(activity) === effectiveMonth)
  const monthText = (key: string) => `${formatMonth(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`
  const columns: [string, string, boolean][] = [
    ['Actividad', cellFirst, false], ['Fecha de inicio', `${cell} ${colDesktop}`, false], ['Unidades asignadas', `${cell} ${colTablet}`, true], ['Disponibles', `${cell} ${colDesktop}`, false],
    ['Costo total', cell, true], ['Precio de venta', `${cell} ${colDesktop}`, true], ['Estado', `${cell} ${colTablet}`, false], ['Acciones', `${cellLast} w-px whitespace-nowrap`, true],
  ]
  const setField = (field: keyof ActivityForm, value: string) => setForm(current => ({ ...current, [field]: value }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Actividades</h1><p className="text-[#4e7460] text-sm">{canManage ? 'Gestiona las actividades de venta de la natillera' : 'Actividades de venta de la natillera'}</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Nueva actividad</button>}
      </div>
      {success && !isDemo && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      {error && activities.length === 0 && !loading && <button onClick={() => { setLoading(true); void load() }} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3 mb-4">Reintentar</button>}
      {!loading && !error && activities.length > 0 && <div className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3" style={cardStyle}>
        <div>
          <label htmlFor="activity-month-filter" className="block text-xs text-[#4e7460] mb-1">Mes de inicio</label>
          <select id="activity-month-filter" value={effectiveMonth} onChange={event => setMonth(event.target.value)} className="w-full sm:w-64 px-3 py-2.5 rounded-lg text-sm">
            <option value="all">Todos los meses</option>
            {months.map(key => <option key={key} value={key}>{`${monthText(key)} (${monthCounts.get(key)})`}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-[#4e7460]" aria-live="polite">Mostrando {filtered.length} de {activities.length} actividades</p>
          {effectiveMonth !== 'all' && <button onClick={() => setMonth('all')} className="btn-ghost px-3 min-h-10 rounded-lg text-xs">Ver todos los meses</button>}
        </div>
      </div>}
      <div className={tableWrap} style={cardStyle}><div className={tableScroll}>
        <table className="w-full text-sm"><thead><tr style={tableHeadStyle}>
          {columns.map(([heading, visibility, right]) => <th key={heading} className={`${headCell} ${visibility} ${right ? 'text-right' : 'text-left'}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#4e7460]"><p role="status">Cargando actividades…</p></td></tr>}
          {!loading && !error && activities.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#4e7460]">{canManage ? 'Aún no hay actividades registradas. Usa «Nueva actividad» para crear la primera.' : 'Aún no hay actividades registradas.'}</td></tr>}
          {!loading && activities.length > 0 && filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#4e7460]">
            <p>No hay actividades que empiecen en {monthText(effectiveMonth)}.</p>
            <button onClick={() => setMonth('all')} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Ver todos los meses</button>
          </td></tr>}
          {!loading && filtered.map(activity => <tr key={activity.id} className="table-row">
            <td className={`${cellFirst} py-3.5 ${cellMain}`}>
              <Link to={`/activities/${activity.id}`} title={activity.name} className={mainLink}>{activity.name}</Link>
              <p className={subMobile}><span className="mono">Inicia {formatDateOnly(activity.startDate)}</span><span className="mono">· {`${activity.assignedQuantity} de ${activity.quantity}`} u.</span><Badge status={activity.status.toLowerCase()} /></p>
              <p className={subTablet}><span className="whitespace-nowrap">Inicia {formatDateOnly(activity.startDate)}</span><span className="whitespace-nowrap">· Precio <span className="mono">{formatCurrency(activity.unitSalePrice)}</span></span><span className="whitespace-nowrap">· {activity.availableQuantity} disponibles</span></p>
            </td>
            <td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460] mono text-xs whitespace-nowrap`}>{formatDateOnly(activity.startDate)}</td>
            <td className={`${cell} ${colTablet} py-3.5 text-right mono text-[#4e7460] whitespace-nowrap`}>{`${activity.assignedQuantity} de ${activity.quantity}`}</td>
            <td className={`${cell} ${colDesktop} py-3.5 mono text-[#4e7460]`}>{activity.availableQuantity}</td>
            <td className={`${cell} py-3.5 ${cellAmount} text-[#0c1a12]`}>{formatCurrency(activity.totalCost)}</td>
            <td className={`${cell} ${colDesktop} py-3.5 text-right mono text-[#0c1a12]`}>{formatCurrency(activity.unitSalePrice)}</td>
            <td className={`${cell} ${colTablet} py-3.5`}><Badge status={activity.status.toLowerCase()} /></td>
            <td className={`${cellLast} py-3.5 ${cellActions}`}><div className="flex justify-end gap-1">
              <button onClick={() => navigate(`/activities/${activity.id}`)} className={eyeButton} aria-label={`Ver detalle de ${activity.name}`}><Icon.Eye open /></button>
              {canManage && activity.status !== 'Cancelled' && <button onClick={() => openEdit(activity)} className={iconButton} aria-label={`Editar ${activity.name}`}><Icon.Edit /></button>}
              {canManage && activity.status !== 'Cancelled' && activity.assignedQuantity === 0 && <button onClick={() => { if (window.confirm(`¿Anular la actividad "${activity.name}"? La actividad y su egreso quedarán anulados.`)) void cancel(activity) }} className={dangerButton} aria-label={`Anular ${activity.name}`}><Icon.Trash /></button>}
            </div></td>
          </tr>)}
        </tbody></table>
      </div></div>
      {modal && <Modal title={editing ? 'Editar actividad' : 'Nueva actividad'} onClose={() => !saving && setModal(null)}><form noValidate onSubmit={event => { event.preventDefault(); void save() }} className="space-y-4">
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Nombre</label><input type="text" maxLength={100} value={form.name} onChange={event => setField('name', event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Descripción</label><input type="text" maxLength={200} value={form.description} onChange={event => setField('description', event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Cantidad</label><input type="number" min="1" step="1" value={form.quantity} onChange={event => setField('quantity', event.target.value)} placeholder="100" className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        <div><label htmlFor="activity-unit-cost" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Costo unitario</label><MoneyInput id="activity-unit-cost" value={form.unitCost} onChange={value => setField('unitCost', value)} placeholder="5000" /></div>
        <div><label htmlFor="activity-unit-sale-price" className="block text-sm font-medium text-[#0c1a12] mb-1.5">Precio de venta unitario</label><MoneyInput id="activity-unit-sale-price" value={form.unitSalePrice} onChange={value => setField('unitSalePrice', value)} placeholder="8000" /></div>
        <div><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Fecha de inicio</label><input type="date" value={form.startDate} onChange={event => setField('startDate', event.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>
        {modalError && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{modalError}</p>}
        <div className="flex gap-3 pt-1"><button type="button" onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
      </form></Modal>}
    </div>
  )
}
