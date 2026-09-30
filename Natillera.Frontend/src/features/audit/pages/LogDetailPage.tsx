import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getLogDetail, type LogDetail } from '@/features/audit/api/logsApi'
import { actionBackground, actionColor, actionLabel, entityBackground, entityColor, entityLabel } from '@/features/audit/model/labels'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'

const money = (value: number | null) => value === null ? '—' : formatCurrency(value)
const card = { background: '#fff', border: '1px solid #d6e8dc' }
const cell = (label: string, value: ReactNode) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><div className="text-sm text-[#0c1a12] break-words">{value}</div></div>

export function LogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [log, setLog] = useState<LogDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !id) return
    const load = async () => {
      try { setLog(await getLogDetail(session.accessToken, id)) }
      catch (requestError) {
        setError(requestError instanceof ApiError && requestError.status === 404 ? 'No se encontró el log solicitado.' : getFriendlyApiError(requestError))
      }
    }
    void load()
  }, [id, session])

  if (error) return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/logs')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!log) return <div className="p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const summary = log.entitySummary
  const actionBadge = <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: actionBackground[log.action], color: actionColor[log.action] }}>{actionLabel[log.action]}</span>
  const entityBadge = <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold" style={{ background: entityBackground[log.entityType], color: entityColor[log.entityType] }}>{entityLabel[log.entityType]}</span>
  const fields: [string, ReactNode][] = [
    ['Fecha de creación', new Date(log.occurredAt).toLocaleString('es-CO')], ['Acción', actionBadge],
    ['Entidad', entityBadge], ['Usuario', log.userName], ['Correo del usuario', log.userEmail],
    ['Valor anterior', money(log.oldValue)], ['Valor nuevo', money(log.newValue)],
  ]
  const summaryFields = ([
    ['Miembro', summary.memberName], ['Año', summary.year], ['Mes', summary.month ? formatMonth(summary.month) : null],
    ['Estado', summary.status ? <Badge status={summary.status.toLowerCase()} /> : null],
    ['Monto actual', summary.amount !== null ? formatCurrency(summary.amount) : null],
  ] as [string, ReactNode][]).filter(([, value]) => value !== null && value !== undefined && value !== '')

  return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/logs')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a logs</button><div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de log</h1><p className="text-[#4e7460] text-sm">Registro de auditoría de la operación</p></div><div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{fields.map(([label, value]) => cell(label, value))}</div>
    {(summaryFields.length > 0 || summary.transactionId) && <><h2 className="text-sm font-bold text-[#0c1a12] mt-6 mb-3">Resumen de la entidad afectada</h2><div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{summaryFields.map(([label, value]) => cell(label, value))}{summary.transactionId && <div className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">Transacción</p><Link to={`/transactions/${summary.transactionId}`} className="text-sm text-[#0a6635] underline">Ver transacción</Link></div>}</div></>}
  </div>
}
