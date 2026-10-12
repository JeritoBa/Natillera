import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { isPendingObligationsError } from '@/features/members/model/memberStatus'
import type { Member } from '@/features/members/model/memberTypes'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { Badge } from '@/shared/ui/Badge'
import { Modal } from '@/shared/ui/Modal'

interface MemberStatusModalProps {
  member: Member
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function MemberStatusModal({ member, onClose, onConfirm }: MemberStatusModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const descriptionId = useId()
  const deactivating = member.isActive
  const fullName = `${member.firstName} ${member.lastName}`

  const confirm = async () => {
    setSaving(true)
    setError(null)
    try { await onConfirm() }
    catch (requestError) { setError(requestError); setSaving(false) }
  }

  return (
    <Modal title={deactivating ? 'Desactivar miembro' : 'Activar miembro'} onClose={() => !saving && onClose()} describedBy={descriptionId}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#d6e8dc] bg-[#f8fbf8] px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0c1a12] truncate">{fullName}</p>
            <p className="text-xs text-[#4e7460] truncate">{member.email}</p>
            <p className="text-xs text-[#4e7460] mono">{member.phone}</p>
          </div>
          <Badge status={member.isActive ? 'active' : 'inactive'} />
        </div>
        <div id={descriptionId} className="text-sm text-[#0c1a12] space-y-2">
          {deactivating ? (
            <>
              <p>Al desactivar a <strong>{fullName}</strong>:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>No podrá ingresar a la natillera y se cerrará su sesión.</li>
                <li>No se le podrán registrar cuotas, préstamos ni actividades.</li>
                <li>Su historial y sus ahorros se conservan.</li>
              </ul>
              <p className="text-xs text-[#4e7460]">Solo se puede desactivar si no tiene cuotas pendientes, préstamos activos, intereses pendientes ni actividades por pagar.</p>
            </>
          ) : (
            <p><strong>{fullName}</strong> podrá volver a ingresar a la natillera y se le podrán registrar cuotas, préstamos y actividades.</p>
          )}
        </div>
        {error !== null && (
          <div role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b] space-y-1.5">
            {isPendingObligationsError(error) ? (
              <>
                <p className="font-medium">No se puede desactivar a {fullName}.</p>
                <p>Primero marca como pagadas o anula sus obligaciones pendientes.</p>
                <p className="mono text-xs">{(error as Error).message}</p>
                <Link to={`/members/${member.id}`} className="inline-block underline font-medium focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded">Ver detalle del miembro</Link>
              </>
            ) : <p>{getFriendlyApiError(error)}</p>}
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button>
          <button type="button" onClick={() => void confirm()} disabled={saving} className={`${deactivating ? 'btn-danger' : 'btn-primary'} flex-1 py-2.5 rounded-lg text-sm`}>
            {saving ? (deactivating ? 'Desactivando...' : 'Activando...') : (deactivating ? 'Desactivar' : 'Activar')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
