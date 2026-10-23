import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getLoanPayment, type LoanPaymentResponse } from '@/features/loans/api/loansApi'
import { methodLabel } from '@/features/loans/model/labels'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'

const card = { background: '#fff', border: '1px solid #d6e8dc' }
const cell = (label: string, value: ReactNode) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><div className="text-sm text-[#0c1a12] break-words">{value}</div></div>

export function LoanPaymentDetailPage() {
  const { loanId, paymentId } = useParams<{ loanId: string, paymentId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [payment, setPayment] = useState<LoanPaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !loanId || !paymentId) return
    const load = async () => {
      try { setPayment(await getLoanPayment(session.accessToken, loanId, paymentId)) }
      catch (requestError) {
        setError(requestError instanceof ApiError && requestError.status === 404 ? 'No se encontró el abono solicitado. Puede pertenecer a otro periodo.' : getFriendlyApiError(requestError))
      }
    }
    void load()
  }, [loanId, paymentId, session])

  const back = `/loans/${loanId}`
  if (error) return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate(back)} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!payment) return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const fields: [string, ReactNode][] = [
    ['Fecha de pago', new Date(payment.paidAt).toLocaleString('es-CO')], ['Monto', formatCurrency(payment.amount)],
    ['Método de pago', methodLabel[payment.paymentMethod]], ['Estado', <Badge status={payment.status.toLowerCase()} />],
  ]

  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate(back)} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver al préstamo</button><div className="mb-6"><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de abono</h1><p className="text-[#4e7460] text-sm">Información del abono a capital</p></div>
    <div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={card}>{fields.map(([label, value]) => cell(label, value))}{cell('Transacción', <Link to={`/transactions/${payment.transactionId}`} className="text-sm text-[#0a6635] underline">Ver transacción</Link>)}</div>
  </div>
}
