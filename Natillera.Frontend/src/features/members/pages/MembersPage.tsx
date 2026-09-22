import { useState } from 'react'
import { useMembers } from '@/features/members/hooks/useMembers'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Member, MemberFormValues } from '@/features/members/model/memberTypes'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

const emptyForm: MemberFormValues = { firstName: '', lastName: '', email: '', phone: '' }

export function MembersPage() {
  const { members, loading, error, create, update, setStatus } = useMembers()
  const { session } = useAuth()
  const canManage = session?.user.role === 'Admin'
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberFormValues>(emptyForm)
  const [actionError, setActionError] = useState<string | null>(null)
  const activeCount = members.filter(member => member.isActive).length

  const openCreate = () => { setEditing(null); setForm(emptyForm); setActionError(null); setModal('create') }
  const openEdit = (member: Member) => {
    setEditing(member)
    setForm({ firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone })
    setActionError(null)
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
  const toggleStatus = async (member: Member) => {
    try { await setStatus(member.id, !member.isActive) }
    catch { setActionError('No pudimos actualizar el estado del miembro. Intenta nuevamente.') }
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
      {(error || actionError) && <p role="alert" className="mb-4 rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error ?? actionError}</p>}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
          {['Nombre', 'Correo', 'Teléfono', 'Estado', ...(canManage ? ['Acciones'] : [])].map((heading, index) => <th key={heading} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${index === 4 ? 'text-right' : 'text-left'}`}>{heading}</th>)}
        </tr></thead><tbody>
          {loading && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">Cargando miembros...</td></tr>}
          {!loading && members.length === 0 && <tr><td colSpan={canManage ? 5 : 4} className="px-5 py-12 text-center text-[#4e7460]">No hay miembros registrados</td></tr>}
          {!loading && members.map(member => <tr key={member.id} className="table-row">
            <td className="px-5 py-3.5"><span className="font-medium text-[#0c1a12]">{member.firstName} {member.lastName}</span></td>
            <td className="px-4 py-3.5 text-[#4e7460]">{member.email}</td><td className="px-4 py-3.5 text-[#4e7460] mono text-xs">{member.phone}</td>
            <td className="px-4 py-3.5"><Badge status={member.isActive ? 'active' : 'cancelled'} /></td>
            {canManage && <td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1"><button onClick={() => openEdit(member)} className="btn-ghost p-1.5 rounded-md" aria-label="Editar miembro"><Icon.Edit /></button><button onClick={() => { if (window.confirm(`${member.isActive ? 'Desactivar' : 'Activar'} a ${member.firstName} ${member.lastName}?`)) void toggleStatus(member) }} className={member.isActive ? 'btn-danger p-1.5 rounded-md' : 'btn-ghost p-1.5 rounded-md'} aria-label={member.isActive ? 'Desactivar miembro' : 'Activar miembro'}><Icon.Check /></button></div></td>}
          </tr>)}
        </tbody></table></div>
      </div>
      {modal && <Modal title={editing ? 'Editar miembro' : 'Nuevo miembro'} onClose={() => setModal(null)}><div className="space-y-4">
        {([['firstName', 'Nombre'], ['lastName', 'Apellido'], ['email', 'Correo'], ['phone', 'Teléfono']] as const).map(([field, label]) => <div key={field}><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">{label}</label><input type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" /></div>)}
        <p className="text-xs text-[#4e7460]">El miembro recibirá la contraseña inicial configurada por el administrador.</p><div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => void save()} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">Guardar</button></div>
      </div></Modal>}
    </div>
  )
}
