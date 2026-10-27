import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMembers } from '@/features/members/hooks/useMembers'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { countMembersByStatus, filterMembers, type MemberStatusFilter } from '@/features/members/model/memberFilters'
import type { Member, MemberFormValues } from '@/features/members/model/memberTypes'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { FormError } from '@/shared/ui/FormError'
import { Modal } from '@/shared/ui/Modal'
import { StatCard } from '@/shared/ui/StatCard'
import { cell, cellActions, cellFirst, cellLast, cellMain, colDesktop, colTablet, dangerButton, eyeButton, headCell, iconButton, mainLink, subMobile, subTablet, tableCardStyle, tableHeadStyle, tableScroll, tableWrap } from '@/shared/ui/tableStyles'
import { MemberStatusModal } from '@/features/members/components/MemberStatusModal'

const emptyForm: MemberFormValues = { firstName: '', lastName: '', email: '', phone: '' }

export function MembersPage() {
  const { members, loading, error, create, update, setStatus } = useMembers()
  const { session, isDemo } = useAuth()
  const navigate = useNavigate()
  const canManage = session?.user.role === 'Admin'
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberFormValues>(emptyForm)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('all')
  const [statusTarget, setStatusTarget] = useState<Member | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const activeCount = members.filter(member => member.isActive).length
  const counts = countMembersByStatus(members)
  const filtered = filterMembers(members, search, statusFilter)
  const hasFilters = search.trim() !== '' || statusFilter !== 'all'
  const clearFilters = () => { setSearch(''); setStatusFilter('all') }

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalError(null); setSuccess(null); setModal('create') }
  const openEdit = (member: Member) => {
    setEditing(member)
    setForm({ firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone })
    setModalError(null)
    setSuccess(null)
    setModal('edit')
  }
  const save = async () => {
    if (saving) return
    setSubmitCount(count => count + 1)
    setModalError(null)
    if (!form.firstName.trim() || !form.lastName.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || !form.phone.trim()) {
      setModalError('Completa todos los campos con datos válidos.')
      return
    }
    setSaving(true)
    try {
      if (editing) await update(editing.id, form)
      else await create(form)
      setModal(null)
    } catch (requestError) { setModalError(getFriendlyApiError(requestError)) }
    finally { setSaving(false) }
  }
  const openStatus = (member: Member) => { setSuccess(null); setStatusTarget(member) }
  const confirmStatus = async () => {
    if (!statusTarget) return
    const member = statusTarget
    await setStatus(member.id, !member.isActive)
    setStatusTarget(null)
    setSuccess(`${member.firstName} ${member.lastName} quedó ${member.isActive ? 'inactivo' : 'activo'}.`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Miembros</h1><p className="text-[#4e7460] text-sm">Administra los miembros de la natillera</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Agregar miembro</button>}
      </div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <StatCard label="Total miembros" value={members.length} />
        <StatCard label="Activos" value={activeCount} tone="positive" />
        <StatCard label="Inactivos" value={members.length - activeCount} tone="negative" />
      </dl>
      {success && !isDemo && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>}
      {!loading && !error && members.length > 0 && <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label htmlFor="member-search" className="block text-xs text-[#4e7460] mb-1">Buscar miembro</label>
            <input id="member-search" type="search" autoComplete="off" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, correo o teléfono" className="w-full px-3 py-2.5 rounded-lg text-sm" />
          </div>
          <div role="group" aria-label="Filtrar por estado" className="flex gap-1.5 flex-wrap">
            {([['all', 'Todos', counts.all], ['active', 'Activos', counts.active], ['inactive', 'Inactivos', counts.inactive]] as const).map(([value, label, count]) =>
              <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`px-3 min-h-10 rounded-lg text-xs font-medium transition-all ${statusFilter === value ? 'bg-[#0c5c38] text-white' : 'btn-ghost'}`}>{label} ({count})</button>)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#4e7460]" aria-live="polite">Mostrando {filtered.length} de {members.length} miembros</p>
          {hasFilters && <button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs">Limpiar filtros</button>}
        </div>
      </div>}
      <div className={tableWrap} style={tableCardStyle}><div className={tableScroll}>
        <table className="w-full text-sm"><thead><tr style={tableHeadStyle}>
          {([['Nombre', cellFirst, 'text-left'], ['Correo', `${cell} ${colDesktop}`, 'text-left'], ['Teléfono', `${cell} ${colDesktop}`, 'text-left'], ['Estado', `${cell} ${colTablet}`, 'text-left'], ...(canManage ? [['Acciones', `${cellLast} w-px whitespace-nowrap`, 'text-right']] : [])] as const).map(([heading, cls, align]) => <th key={heading} className={`${headCell} ${cls} ${align}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">Cargando miembros...</td></tr>}
          {!loading && members.length === 0 && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">No hay miembros registrados</td></tr>}
          {!loading && members.length > 0 && filtered.length === 0 && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">
            <p>No hay miembros que coincidan con la búsqueda.</p>
            <button type="button" onClick={clearFilters} className="btn-ghost px-3 min-h-10 rounded-lg text-xs mt-2">Limpiar filtros</button>
          </td></tr>}
          {!loading && filtered.map(member => <tr key={member.id} className="table-row">
            <td className={`${cellFirst} py-3.5 ${cellMain}`}>
              {canManage
                ? <Link to={`/members/${member.id}`} className={mainLink}>{member.firstName} {member.lastName}</Link>
                : <span className="block truncate sm:inline sm:whitespace-normal font-medium text-[#0c1a12]">{member.firstName} {member.lastName}</span>}
              <p className={subMobile}><span className="truncate max-w-full">{member.email}</span><Badge status={member.isActive ? 'active' : 'inactive'} /></p>
              <p className={subTablet}><span>{member.email}</span><span className="whitespace-nowrap">· <span className="mono">{member.phone}</span></span></p>
            </td>
            <td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460]`}>{member.email}</td><td className={`${cell} ${colDesktop} py-3.5 text-[#4e7460] mono text-xs`}>{member.phone}</td>
            <td className={`${cell} ${colTablet} py-3.5`}><Badge status={member.isActive ? 'active' : 'inactive'} /></td>
            {canManage && <td className={`${cellLast} py-3.5 ${cellActions}`}><div className="flex justify-end gap-1"><button onClick={() => navigate(`/members/${member.id}`)} className={eyeButton} aria-label="Ver detalle del miembro"><Icon.Eye open /></button><button onClick={() => openEdit(member)} className={iconButton} aria-label="Editar miembro"><Icon.Edit /></button><button onClick={() => openStatus(member)} className={member.isActive ? dangerButton : iconButton} aria-label={member.isActive ? 'Desactivar miembro' : 'Activar miembro'}><Icon.Check /></button></div></td>}
          </tr>)}
        </tbody></table>
      </div></div>
      {modal && <Modal title={editing ? 'Editar miembro' : 'Nuevo miembro'} onClose={() => !saving && setModal(null)}><form noValidate onSubmit={event => { event.preventDefault(); void save() }} className="space-y-4">
        {([['firstName', 'Nombre'], ['lastName', 'Apellido'], ['email', 'Correo'], ['phone', 'Teléfono']] as const).map(([field, label]) => <div key={field}><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">{label}</label><input type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>)}
        <p className="text-xs text-[#4e7460]">El miembro recibirá la contraseña inicial configurada por el administrador.</p>
        <FormError message={modalError} revision={submitCount} />
        <div className="flex gap-3 pt-1"><button type="button" onClick={() => setModal(null)} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">{saving ? 'Guardando...' : 'Guardar'}</button></div>
      </form></Modal>}
      {statusTarget && <MemberStatusModal member={statusTarget} onClose={() => setStatusTarget(null)} onConfirm={confirmStatus} />}
    </div>
  )
}
