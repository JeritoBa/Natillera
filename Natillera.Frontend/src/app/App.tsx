import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from '@/features/auth/pages/AuthPage'
import { AdminRoute } from '@/features/auth/components/AdminRoute'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { DemoPage } from '@/features/demo/pages/DemoPage'
import { MembersPage } from '@/features/members/pages/MembersPage'
import { MemberDetailPage } from '@/features/members/pages/MemberDetailPage'
import { ActivitiesPage } from '@/features/activities/pages/ActivitiesPage'
import { ActivityDetailPage } from '@/features/activities/pages/ActivityDetailPage'
import { ActivityAssignmentDetailPage } from '@/features/activities/pages/ActivityAssignmentDetailPage'
import { LoansPage } from '@/features/loans/pages/LoansPage'
import { LoanDetailPage } from '@/features/loans/pages/LoanDetailPage'
import { LoanPaymentDetailPage } from '@/features/loans/pages/LoanPaymentDetailPage'
import { InterestPaymentDetailPage } from '@/features/loans/pages/InterestPaymentDetailPage'
import { MonthlyPaymentsPage } from '@/features/monthlyPayments/pages/MonthlyPaymentsPage'
import { LogsPage } from '@/features/audit/pages/LogsPage'
import { LogDetailPage } from '@/features/audit/pages/LogDetailPage'
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage'
import { TransactionDetailPage } from '@/features/transactions/pages/TransactionDetailPage'
import { SavingPeriodProvider } from '@/features/settings/context/SavingPeriodProvider'
import { PeriodGate } from '@/features/settings/components/PeriodGate'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { useSavingPeriod } from '@/features/settings/hooks/useSavingPeriod'
import type { Page } from '@/shared/model/types'
import { AppShell } from '@/shared/layout/AppShell'
import { useDocumentTitle } from '@/app/useDocumentTitle'

const pagePaths: Record<Page, string> = {
  landing: '/', auth: '/login', dashboard: '/dashboard', members: '/members', loans: '/loans',
  activities: '/activities', payments: '/payments', transactions: '/transactions', logs: '/logs', settings: '/settings',
}
type DashboardPage = Exclude<Page, 'landing' | 'auth'>

function LandingRoute() {
  const { isDemo, exitDemo } = useAuth()
  // DEMO-05: leaving to the landing (logo link, browser navigation) ends the demo.
  useEffect(() => { if (isDemo) exitDemo() }, [isDemo, exitDemo])
  return <LandingPage />
}

function LoginRoute() {
  const navigate = useNavigate()
  const { isAuthenticated, isDemo, exitDemo } = useAuth()
  useEffect(() => { if (isDemo) exitDemo() }, [isDemo, exitDemo])
  if (isAuthenticated && !isDemo) return <Navigate to="/dashboard" replace />
  return <AuthPage setPage={page => navigate(pagePaths[page])} />
}

// PER-03: refetch every period-scoped page when the selected period changes (the Outlet remounts); /settings stays mounted to keep its saved message.
function PeriodOutlet() {
  const { selected } = useSavingPeriod()
  const { pathname } = useLocation()
  return <PeriodGate><Outlet key={pathname === '/settings' ? 'settings' : selected?.id} /></PeriodGate>
}

function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageBySection: Record<string, DashboardPage> = {
    dashboard: 'dashboard', members: 'members', loans: 'loans', activities: 'activities',
    payments: 'payments', transactions: 'transactions', logs: 'logs', settings: 'settings',
  }
  // Detail routes (/members/:id, /logs/:id...) keep their parent section highlighted in the sidebar.
  const page = pageBySection[location.pathname.split('/')[1]] ?? 'dashboard'

  return <SavingPeriodProvider><AppShell page={page} setPage={nextPage => navigate(pagePaths[nextPage])}><PeriodOutlet /></AppShell></SavingPeriodProvider>
}

export default function App() {
  useDocumentTitle()

  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/loans/:id" element={<LoanDetailPage />} />
          <Route path="/loans/:loanId/payments/:paymentId" element={<LoanPaymentDetailPage />} />
          <Route path="/loans/:loanId/interest-payments/:interestId" element={<InterestPaymentDetailPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities/:activityId/assignments/:assignmentId" element={<ActivityAssignmentDetailPage />} />
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
