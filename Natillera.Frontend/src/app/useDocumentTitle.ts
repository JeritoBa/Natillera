import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const appName = 'Natillera Gallego Nanclares'

const sectionTitles: Record<string, { list: string, detail?: string }> = {
  login: { list: 'Iniciar sesión' },
  dashboard: { list: 'Dashboard' },
  members: { list: 'Miembros', detail: 'Detalle de miembro' },
  payments: { list: 'Cuotas' },
  activities: { list: 'Actividades' },
  loans: { list: 'Préstamos', detail: 'Detalle de préstamo' },
  transactions: { list: 'Transacciones', detail: 'Detalle de transacción' },
  logs: { list: 'Logs', detail: 'Detalle de log' },
}

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const [section, id, child] = pathname.split('/').filter(Boolean)
    const titles = section ? sectionTitles[section] : undefined
    const nestedDetail = section === 'loans' && child ? (child === 'payments' ? 'Detalle de abono' : 'Detalle de interés') : undefined
    const pageTitle = titles ? (nestedDetail ?? (id && titles.detail ? titles.detail : titles.list)) : null
    document.title = pageTitle ? `${pageTitle} · ${appName}` : appName
  }, [pathname])
}
