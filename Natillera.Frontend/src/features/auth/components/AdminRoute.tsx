import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function AdminRoute() {
  const { session } = useAuth()
  if (session?.user.role !== 'Admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
