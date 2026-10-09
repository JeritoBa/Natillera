import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { appName } from '@/app/useDocumentTitle'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getMemberDetail, type MemberDetail } from '@/features/members/api/membersApi'
import { typeLabel } from '@/features/transactions/model/labels'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency, formatMonth } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Icon } from '@/shared/ui/Icon'

const roleLabel: Record<string, string> = { Admin: 'Administrador', Member: 'Miembro' }
const cardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
const rowClass = 'flex justify-between border-t border-[#eef4f0] pt-2'
const signed = (amount: number) => `${amount < 0 ? '−' : '+'}${formatCurrency(Math.abs(amount))}`
const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CO')
const longDate = (value: string) => new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
const collapsedCount = 5

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    if (!session || !id) return
    const current = ++requestId.current
    setLoading(true); setError(null); setNotFound(false); setDetail(null); setShowAll(false)
    try {
      const result = await getMemberDetail(session.accessToken, id)
      if (current === requestId.current) setDetail(result)
    } catch (requestError) {
      if (current !== requestId.current) return
      if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true)
      else setError(getFriendlyApiError(requestError))
    } finally {
      if (current === requestId.current) setLoading(false)
    }
  }, [id, session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (detail) document.title = `${detail.member.firstName} ${detail.member.lastName} · ${appName}`
  }, [detail])

  const back = <button onClick={() => navigate('/members')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a miembros</button>

  if (loading) return <div className="p-6 lg:p-8 max-w-5xl">{back}<p role="status" className="text-[#4e7460]">Cargando miembro…</p></div>
  if (notFound) return <div className="p-6 lg:p-8 max-w-5xl">{back}
    <div role="alert" className="rounded-xl p-8 text-center" style={cardStyle}>
      <h1 className="text-lg font-bold text-[#0c1a12]">No se encontró el miembro</h1>
      <p className="text-sm text-[#4e7460]">Puede que el enlace esté incompleto o que el miembro no exista.</p>
      <button onClick={() => navigate('/members')} className="btn-primary px-4 py-2 rounded-lg text-sm mt-4">Ver lista de miembros</button>
    </div>
  </div>
  if (error || !detail) return <div className="p-6 lg:p-8 max-w-5xl">{back}
    <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p>
    <button onClick={() => void load()} className="btn-ghost px-4 py-2 rounded-lg text-sm mt-3">Reintentar</button>
  </div>

  const { member, balance, pendingPayments, transactions } = detail
  const fullName = `${member.firstName} ${member.lastName}`
  const pendingTotal = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const sorted = [...transactions].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  const visible = showAll ? sorted : sorted.slice(0, collapsedCount)
  const info: [string, React.ReactNode][] = [
    ['Nombre completo', fullName],
    ['Correo', member.email],
    ['Teléfono', <span className="mono">{member.phone}</span>],
    ['Rol', roleLabel[member.role] ?? member.role],
    ['Estado', <Badge status={member.isActive ? 'active' : 'inactive'} />],
    ['Miembro desde', longDate(member.createdAt)],
    ['Última actualización', member.updatedAt ? new Date(member.updatedAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) : 'Sin cambios desde el alta'],
  ]

  return <div className="p-6 lg:p-8 max-w-5xl">
    {back}
    <div className="mb-7">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-[#0c1a12] break-words">{fullName}</h1>
        <Badge status={member.isActive ? 'active' : 'inactive'} />
      </div>
      <p className="text-[#4e7460] text-sm mt-0.5">Miembro desde el {longDate(member.createdAt)}</p>
      {!member.isActive && <p role="status" className="mt-3 rounded-lg border border-[#d6e8dc] bg-[#eef4f0] px-3 py-2.5 text-sm text-[#4e7460]">Este miembro está inactivo. Su historial y sus ahorros se conservan.</p>}
    </div>

    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section aria-labelledby="member-savings-title" className="stat-card rounded-xl p-5 lg:col-span-3" style={{ border: '1px solid #0c5c38' }}>
          <h2 id="member-savings-title" className="text-sm font-semibold text-[#0c1a12]">Ahorros de {member.firstName}</h2>
          <p className="mono text-2xl md:text-3xl font-bold text-[#0a6635] mt-2 break-words">{balance.total < 0 ? '−' : ''}{formatCurrency(balance.total)}</p>
          <p className="text-xs text-[#4e7460]">Lo que ha aportado más lo que ha ganado</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className={rowClass}><dt className="text-[#0c1a12]">Cuotas pagadas</dt><dd className="mono text-[#0c1a12]">{formatCurrency(balance.savings)}</dd></div>
            <div className={rowClass}><dt><span className="text-[#0c1a12]">Ganancia en actividades</span><span className="block text-xs text-[#4e7460]">Ventas de actividades</span></dt><dd className="mono text-[#0a6635]">{formatCurrency(balance.activityEarnings)}</dd></div>
            <div className={rowClass}><dt><span className="text-[#0c1a12]">Rendimientos</span><span className="block text-xs text-[#4e7460]">Su parte de los intereses de préstamos</span></dt><dd className="mono text-[#0a6635]">{formatCurrency(balance.performanceEarnings)}</dd></div>
          </dl>
          {balance.total === 0 && <p className="mt-3 text-xs text-[#4e7460]">Aún no tiene cuotas pagadas.</p>}
        </section>

        <section aria-labelledby="member-pending-title" className="rounded-xl p-5 lg:col-span-2" style={cardStyle}>
          <h2 id="member-pending-title" className="text-sm font-semibold text-[#0c1a12]">Cuotas pendientes</h2>
          {pendingPayments.length === 0 ? <>
            <p className="flex items-center gap-2 mt-3 text-base font-semibold text-[#0a6635]"><span aria-hidden="true" className="w-7 h-7 rounded-full bg-[#dcf5e8] flex items-center justify-center"><Icon.Check /></span>Está al día</p>
            <p className="text-xs text-[#4e7460]">No tiene cuotas pendientes por pagar.</p>
          </> : <>
            <p className="mono text-2xl font-bold text-[#9a6e00] mt-2">Debe {formatCurrency(pendingTotal)}</p>
            <p className="text-xs text-[#4e7460]">{pendingPayments.length === 1 ? '1 cuota sin pagar' : `${pendingPayments.length} cuotas sin pagar`}</p>
            <ul className="mt-4 space-y-2 text-sm">{pendingPayments.map(payment => <li key={payment.id} className={rowClass}>
              <span className="text-[#0c1a12]">{formatMonth(payment.month)} {payment.year}</span>
              <span className="mono text-[#0c1a12] text-right">{formatCurrency(payment.amount)}</span>
            </li>)}</ul>
          </>}
        </section>
      </div>

      <section aria-labelledby="member-recent-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: '#eef4f0' }}>
          <h2 id="member-recent-title" className="text-sm font-semibold text-[#4e7460]">Movimientos recientes</h2>
          {sorted.length > collapsedCount && <button type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)} className="btn-ghost text-sm px-3 min-h-10 rounded-md">{showAll ? 'Ver menos' : `Ver todos (${sorted.length})`}</button>}
        </div>
        {sorted.length === 0 ? <p className="px-5 py-10 text-center text-sm text-[#4e7460]">Aún no tiene movimientos registrados</p>
          : <table className="w-full text-sm"><tbody>{visible.map(transaction => {
            const date = formatDate(transaction.occurredAt)
            return <tr key={transaction.id} className="table-row">
              <td className="px-5 py-2.5 mono text-xs text-[#4e7460] whitespace-nowrap hidden sm:table-cell">{date}</td>
              <td className="px-5 py-2.5"><p className="text-[#0c1a12]">{typeLabel[transaction.type]}</p><p className="text-xs text-[#4e7460] truncate max-w-[260px]"><span className="sm:hidden">{date} · </span>{transaction.description}</p></td>
              <td className={`px-5 py-2.5 text-right mono font-semibold whitespace-nowrap ${transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{signed(transaction.direction === 'Expense' ? -transaction.amount : transaction.amount)}</td>
              <td className="px-3 py-2.5 text-right w-12"><button onClick={() => navigate(`/transactions/${transaction.id}`)} className="btn-ghost p-2 rounded-md min-w-10 min-h-10" aria-label={`Ver detalle del movimiento ${typeLabel[transaction.type]} del ${date}`}><Icon.Eye open /></button></td>
            </tr>
          })}</tbody></table>}
      </section>

      <section aria-labelledby="member-info-title" className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 border-b" style={{ borderColor: '#eef4f0' }}>
          <h2 id="member-info-title" className="text-sm font-semibold text-[#4e7460]">Datos personales</h2>
        </div>
        <dl className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {info.map(([label, value]) => <div key={label} className="border-b border-[#eef4f0] pb-3"><dt className="text-xs text-[#4e7460] mb-1">{label}</dt><dd className="text-sm text-[#0c1a12] break-words">{value}</dd></div>)}
        </dl>
      </section>
    </div>
  </div>
}
