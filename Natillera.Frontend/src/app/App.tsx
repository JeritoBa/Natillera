import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from '@/features/auth/pages/AuthPage'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { MembersPage } from '@/features/members/pages/MembersPage'
import { ActivitiesPage, LoansPage } from '@/features/management/pages/ManagementPages'
import { MonthlyPaymentsPage } from '@/features/monthlyPayments/pages/MonthlyPaymentsPage'
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage'
import type { Page } from '@/shared/model/types'
import { AppShell } from '@/shared/layout/AppShell'

const pagePaths: Record<Page, string> = {
  landing: '/', auth: '/login', dashboard: '/dashboard', members: '/members', loans: '/loans',
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
    '/dashboard': 'dashboard', '/members': 'members', '/loans': 'loans', '/activities': 'activities',
    '/payments': 'payments', '/transactions': 'transactions',
  }
  const page = pageByPath[location.pathname] as DashboardPage

  const pages: Record<DashboardPage, ReactNode> = {
    dashboard: <DashboardPage />,
    members: <MembersPage />,
    loans: <LoansPage />,
    activities: <ActivitiesPage />,
    payments: <MonthlyPaymentsPage />,
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
        <Route path="/members" element={<DashboardLayout />} />
        <Route path="/loans" element={<DashboardLayout />} />
        <Route path="/activities" element={<DashboardLayout />} />
        <Route path="/payments" element={<DashboardLayout />} />
        <Route path="/transactions" element={<DashboardLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
