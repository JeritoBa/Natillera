import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from '@/features/auth/pages/AuthPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { ActivitiesPage, LoansPage, PaymentsPage, TransactionsPage } from '@/features/management/pages/ManagementPages'
import type { Page } from '@/shared/model/types'
import { AppShell } from '@/shared/layout/AppShell'

const dashboardPages: Partial<Record<Page, ReactNode>> = {
  dashboard: <DashboardPage />,
  loans: <LoansPage />,
  activities: <ActivitiesPage />,
  payments: <PaymentsPage />,
  transactions: <TransactionsPage />,
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [fallbackPage, setFallbackPage] = useState<Page>('landing')
  const pathToPage: Record<string, Page> = {
    '/': 'landing', '/login': 'auth', '/dashboard': 'dashboard', '/loans': 'loans',
    '/activities': 'activities', '/payments': 'payments', '/transactions': 'transactions',
  }
  const page = pathToPage[location.pathname] ?? fallbackPage
  const setPage = (nextPage: Page) => {
    setFallbackPage(nextPage)
    const pathByPage: Record<Page, string> = {
      landing: '/', auth: '/login', dashboard: '/dashboard', loans: '/loans',
      activities: '/activities', payments: '/payments', transactions: '/transactions',
    }
    navigate(pathByPage[nextPage])
  }

  if (page === 'landing') return <LandingPage setPage={setPage} />
  if (page === 'auth') return <AuthPage setPage={setPage} />
  return <AppShell page={page} setPage={setPage}>{dashboardPages[page]}</AppShell>
}
