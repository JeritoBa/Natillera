import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTransactionDetail, type TransactionDetail } from '@/features/transactions/api/transactionsApi'
import { getFriendlyApiError } from '@/shared/api/apiError'
import { formatCurrency } from '@/shared/lib/formatters'

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !id) return
    const load = async () => {
      try { setTransaction(await getTransactionDetail(session.accessToken, id)) }
      catch (requestError) { setError(getFriendlyApiError(requestError)) }
    }
    void load()
  }, [id, session])

  if (error) return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/transactions')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver</button><p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{error}</p></div>
  if (!transaction) return <div className="p-6 lg:p-8 max-w-5xl text-[#4e7460]">Cargando detalle...</div>

  const source = transaction.source
  const fields = [['Identificador', transaction.id], ['Fecha y hora', new Date(transaction.occurredAt).toLocaleString('es-CO')], ['Dirección', transaction.direction === 'Income' ? 'Ingreso' : 'Egreso'], ['Tipo', transaction.type], ['Descripción', transaction.description], ['Miembro', source.memberName], ['Estado', source.status], ['Año', source.year], ['Mes', source.month], ['Fecha de pago', source.paidAt ? new Date(source.paidAt).toLocaleDateString('es-CO') : null], ['Actividad', source.activityName], ['Descripción actividad', source.activityDescription], ['Cantidad asignada', source.quantityAssigned], ['Costo unitario', source.unitCost ? formatCurrency(source.unitCost) : null], ['Precio de venta', source.unitSalePrice ? formatCurrency(source.unitSalePrice) : null], ['Método de pago', source.paymentMethod], ['Monto inicial préstamo', source.initialAmount ? formatCurrency(source.initialAmount) : null], ['Tasa de interés', source.interestRate ? `${source.interestRate}%` : null]].filter(([, value]) => value !== null && value !== undefined && value !== '')

  return <div className="p-6 lg:p-8 max-w-5xl"><button onClick={() => navigate('/transactions')} className="btn-ghost px-4 py-2 rounded-lg text-sm mb-5">← Volver a transacciones</button><div className="flex items-start justify-between mb-6 gap-4"><div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">Detalle de transacción</h1><p className="text-[#4e7460] text-sm">Información exacta del movimiento y su operación origen</p></div><p className={`text-xl font-bold mono ${transaction.direction === 'Expense' ? 'text-[#c0392b]' : 'text-[#0a6635]'}`}>{transaction.direction === 'Expense' ? '−' : '+'}{formatCurrency(transaction.amount)}</p></div><div className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>{fields.map(([label, value]) => <div key={label} className="border-b border-[#eef4f0] pb-3"><p className="text-xs text-[#4e7460] mb-1">{label}</p><p className="text-sm text-[#0c1a12] break-words">{value}</p></div>)}</div></div>
}
