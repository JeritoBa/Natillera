import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getActivityAssignment, type ActivityAssignmentResponse } from '@/features/activities/api/activitiesApi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'

const card = { background: '#fff', border: '1px solid #d6e8dc' }
const cell = (label: string, value: ReactNode) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><div className="text-sm text-[#0c1a12] break-words">{value}</div></div>

export function ActivityAssignmentDetailPage() {
  const { activityId, assignmentId } = useParams<{ activityId: string, assignmentId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [assignment, setAssignment] = useState<ActivityAssignmentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !activityId || !assignmentId) return
    const load = async () => {
      try { setAssignment(await getActivityAssignment(session.accessToken, activityId, assignmentId)) }
      catch (requestError) {
        setError(requestError instanceof ApiError && requestError.status === 404 ? 'No se encontró la asignación solicitada.' : getFriendlyApiError(requestError))
      }
    }
    void load()
  }, [activityId, assignmentId, session])

  const back = `/activities/${activityId}`
  if (error) return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate(back)} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!assignment) return <div className="p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const fields: [string, ReactNode][] = [
    ['Miembro', assignment.memberName], ['Cantidad asignada', assignment.quantityAssigned], ['Valor de venta', formatCurrency(assignment.saleAmount)],
    ['Estado', <Badge status={assignment.status.toLowerCase()} />], ['Fecha de asignación', new Date(assignment.assignedAt).toLocaleString('es-CO')],
    ['Fecha de pago', assignment.paidAt ? new Date(assignment.paidAt).toLocaleString('es-CO') : '—'],
  ]

  return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate(back)} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a la actividad</button><div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de asignación</h1><p className="text-[#4e7460] text-sm">Información de la asignación del miembro en la actividad</p></div>
    <div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{fields.map(([label, value]) => cell(label, value))}{assignment.transactionId && cell('Transacción', <Link to={`/transactions/${assignment.transactionId}`} className="text-sm text-[#0a6635] underline">Ver transacción</Link>)}</div>
  </div>
}
