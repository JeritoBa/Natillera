import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMembers } from '@/features/members/hooks/useMembers'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Member, MemberFormValues } from '@/features/members/model/memberTypes'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'
import { MemberStatusModal } from '@/features/members/components/MemberStatusModal'

const emptyForm: MemberFormValues = { firstName: '', lastName: '', email: '', phone: '' }

export function MembersPage() {
  const { members, loading, error, create, update, setStatus } = useMembers()
  const { session } = useAuth()
  const navigate = useNavigate()
  const canManage = session?.user.role === 'Admin'
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberFormValues>(emptyForm)
  const [actionError, setActionError] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<Member | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const activeCount = members.filter(member => member.isActive).length

  const openCreate = () => { setEditing(null); setForm(emptyForm); setActionError(null); setSuccess(null); setModal('create') }
  const openEdit = (member: Member) => {
    setEditing(member)
    setForm({ firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone })
    setActionError(null)
    setSuccess(null)
    setModal('edit')
  }
  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || !form.phone.trim()) {
      setActionError('Completa todos los campos con datos válidos.')
      return
    }
    try {
      if (editing) await update(editing.id, form)
      else await create(form)
      setModal(null)
    } catch { setActionError('No pudimos guardar el miembro. Revisa los datos e intenta nuevamente.') }
  }
  const openStatus = (member: Member) => { setActionError(null); setSuccess(null); setStatusTarget(member) }
  const confirmStatus = async () => {
    if (!statusTarget) return
    const member = statusTarget
    await setStatus(member.id, !member.isActive)
    setStatusTarget(null)
    setSuccess(`${member.firstName} ${member.lastName} quedó ${member.isActive ? 'inactivo' : 'activo'}.`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Miembros</h1><p className="text-[#4e7460] text-sm">Administra los miembros de la natillera</p></div>
        {canManage && <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Agregar miembro</button>}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Total miembros</p><p className="text-lg font-bold text-[#0c1a12] mono">{members.length}</p></div>
        <div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Activos</p><p className="text-lg font-bold text-[#0a6635] mono">{activeCount}</p></div>
        <div className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">Inactivos</p><p className="text-lg font-bold text-[#c0392b] mono">{members.length - activeCount}</p></div>
      </div>
      {success && <p role="status" className="mb-4 rounded-lg border border-[#b8e2c8] bg-[#eef9f1] px-3 py-2.5 text-sm text-[#0a6635]">{success}</p>}
      {(error || actionError) && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error ?? actionError}</p>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
          {([['Nombre', 'px-3 sm:px-5'], ['Correo', 'hidden sm:table-cell px-4'], ['Teléfono', 'hidden sm:table-cell px-4'], ['Estado', 'hidden sm:table-cell px-4'], ...(canManage ? [['Acciones', 'px-3 sm:px-5 w-px whitespace-nowrap text-right']] : [])] as const).map(([heading, cls]) => <th key={heading} className={`py-3 text-[#4e7460] text-xs font-medium ${cls.includes('text-right') ? '' : 'text-left'} ${cls}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">Cargando miembros...</td></tr>}
          {!loading && members.length === 0 && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">No hay miembros registrados</td></tr>}
          {!loading && members.map(member => <tr key={member.id} className="table-row">
            <td className="px-3 sm:px-5 py-3.5 max-w-0 sm:max-w-none">
              {canManage
                ? <Link to={`/members/${member.id}`} className="sm:pointer-events-none font-medium text-[#0c1a12] hover:underline sm:hover:no-underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">{member.firstName} {member.lastName}</Link>
                : <span className="font-medium text-[#0c1a12]">{member.firstName} {member.lastName}</span>}
              <p className="sm:hidden text-xs text-[#4e7460] mt-0.5 flex items-center gap-1.5 flex-wrap"><span className="truncate max-w-full">{member.email}</span><Badge status={member.isActive ? 'active' : 'inactive'} /></p>
            </td>
            <td className="px-4 py-3.5 text-[#4e7460] hidden sm:table-cell">{member.email}</td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs hidden sm:table-cell">{member.phone}</td>
            <td className="px-4 py-3.5 hidden sm:table-cell"><Badge status={member.isActive ? 'active' : 'inactive'} /></td>
            {canManage && <td className="px-3 sm:px-5 py-3.5 text-right w-px whitespace-nowrap"><div className="flex justify-end gap-1"><button onClick={() => navigate(`/members/${member.id}`)} className="btn-ghost p-1.5 rounded-md hidden sm:inline-flex" aria-label="Ver detalle del miembro"><Icon.Eye open /></button><button onClick={() => openEdit(member)} className="btn-ghost p-2 sm:p-1.5 rounded-md min-w-10 min-h-10 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center" aria-label="Editar miembro"><Icon.Edit /></button><button onClick={() => openStatus(member)} className={`${member.isActive ? 'btn-danger' : 'btn-ghost'} p-2 sm:p-1.5 rounded-md min-w-10 min-h-10 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center`} aria-label={member.isActive ? 'Desactivar miembro' : 'Activar miembro'}><Icon.Check /></button></div></td>}
          </tr>)}
        </tbody></table>
      </div>
      {modal && <Modal title={editing ? 'Editar miembro' : 'Nuevo miembro'} onClose={() => setModal(null)}><div className="space-y-4">
        {([['firstName', 'Nombre'], ['lastName', 'Apellido'], ['email', 'Correo'], ['phone', 'Teléfono']] as const).map(([field, label]) => <div key={field}><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">{label}</label><input type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>)}
        <p className="text-xs text-[#4e7460]">El miembro recibirá la contraseña inicial configurada por el administrador.</p><div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">Guardar</button></div>
      </div></Modal>}
      {statusTarget && <MemberStatusModal member={statusTarget} onClose={() => setStatusTarget(null)} onConfirm={confirmStatus} />}
    </div>
  )
}
