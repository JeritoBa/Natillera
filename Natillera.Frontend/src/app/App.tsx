import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from '@/features/auth/pages/AuthPage'
import { AdminRoute } from '@/features/auth/components/AdminRoute'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { MembersPage } from '@/features/members/pages/MembersPage'
import { MemberDetailPage } from '@/features/members/pages/MemberDetailPage'
import { ActivitiesPage, LoansPage } from '@/features/management/pages/ManagementPages'
import { MonthlyPaymentsPage } from '@/features/monthlyPayments/pages/MonthlyPaymentsPage'
import { LogsPage } from '@/features/audit/pages/LogsPage'
import { LogDetailPage } from '@/features/audit/pages/LogDetailPage'
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage'
import { TransactionDetailPage } from '@/features/transactions/pages/TransactionDetailPage'
import type { Page } from '@/shared/model/types'
import { AppShell } from '@/shared/layout/AppShell'
import { useDocumentTitle } from '@/app/useDocumentTitle'

const pagePaths: Record<Page, string> = {
  landing: '/', auth: '/login', dashboard: '/dashboard', members: '/members', loans: '/loans',
  activities: '/activities', payments: '/payments', transactions: '/transactions', logs: '/logs',
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
  const pageBySection: Record<string, DashboardPage> = {
    dashboard: 'dashboard', members: 'members', loans: 'loans', activities: 'activities',
    payments: 'payments', transactions: 'transactions', logs: 'logs',
  }
  // Detail routes (/members/:id, /logs/:id...) keep their parent section highlighted in the sidebar.
  const page = pageBySection[location.pathname.split('/')[1]] ?? 'dashboard'

  return <AppShell page={page} setPage={nextPage => navigate(pagePaths[nextPage])}><Outlet /></AppShell>
}

export default function App() {
  useDocumentTitle()

  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/payments" element={<MonthlyPaymentsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/members/:id" element={<MemberDetailPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/logs/:id" element={<LogDetailPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
