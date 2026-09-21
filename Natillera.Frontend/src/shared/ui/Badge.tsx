export function Badge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    paid: 'badge-positive', active: 'badge-positive', completed: 'badge-positive',
    pending: 'badge-pending',
    overdue: 'badge-negative', cancelled: 'badge-negative',
  }
  const label: Record<string, string> = {
    paid: 'Pagado', active: 'Activo', completed: 'Completado',
    pending: 'Pendiente',
    overdue: 'Vencido', cancelled: 'Cancelado',
  }
  return (
    <span className={`px-2 py-0.5 rounded uppercase font-medium ${cls[status] || 'badge-neutral'}`}>
      {label[status] || status}
    </span>
  )
}
