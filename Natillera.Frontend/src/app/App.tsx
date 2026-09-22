import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from '@/features/auth/pages/AuthPage'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { ActivitiesPage, LoansPage, PaymentsPage, TransactionsPage } from '@/features/management/pages/ManagementPages'
import type { Page } from '@/shared/model/types'
import { AppShell } from '@/shared/layout/AppShell'

const pagePaths: Record<Page, string> = {
  landing: '/', auth: '/login', dashboard: '/dashboard', loans: '/loans',
  activities: '/activities', payments: '/payments', transactions: '/transactions',
}
type DashboardPage = Exclude<Page, 'landing' | 'auth'>

function LandingRoute() {
  const navigate = useNavigate()
  return <LandingPage setPage={page => navigate(pagePaths[page])} />
}

function LoginRoute() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <AuthPage setPage={page => navigate(pagePaths[page])} />
}

function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageByPath: Record<string, Page> = {
    '/dashboard': 'dashboard', '/loans': 'loans', '/activities': 'activities',
    '/payments': 'payments', '/transactions': 'transactions',
  }
  const page = pageByPath[location.pathname] as DashboardPage

  const pages: Record<DashboardPage, ReactNode> = {
    dashboard: <DashboardPage />,
    loans: <LoansPage />,
    activities: <ActivitiesPage />,
    payments: <PaymentsPage />,
    transactions: <TransactionsPage />,
  }

  return <AppShell page={page} setPage={nextPage => navigate(pagePaths[nextPage])}>{pages[page]}</AppShell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />} />
        <Route path="/loans" element={<DashboardLayout />} />
        <Route path="/activities" element={<DashboardLayout />} />
        <Route path="/payments" element={<DashboardLayout />} />
        <Route path="/transactions" element={<DashboardLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
