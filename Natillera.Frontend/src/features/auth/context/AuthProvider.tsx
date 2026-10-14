import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { loginRequest } from '@/features/auth/services/authApi'
import { UNAUTHORIZED_EVENT } from '@/shared/api/apiClient'
import { SESSION_EXPIRED_NOTICE_KEY, type AuthSession } from '@/features/auth/model/authTypes'
import { AuthContext } from '@/features/auth/context/authContext'
import { demoUsers } from '@/features/demo/model/demoFixtures'
import { buildDemoSession, clearDemoRole, readDemoRole, writeDemoRole, type DemoRole } from '@/features/demo/model/demoSession'

const SESSION_KEY = 'natillera.auth.session'

function readSession(): AuthSession | null {
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (!stored) return null

  try {
    const session = JSON.parse(stored) as AuthSession
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [realSession, setSession] = useState<AuthSession | null>(readSession)
  const [demoRole, setDemoRole] = useState<DemoRole | null>(readDemoRole)
  const [isLoading, setIsLoading] = useState(false)

  // DEMO-05: in demo mode the exposed session is a fixed fictitious one; the real session is never kept alongside it.
  const session = useMemo(
    () => (demoRole ? buildDemoSession(demoRole === 'Admin' ? demoUsers.admin : demoUsers.member) : realSession),
    [demoRole, realSession],
  )

  const enterDemo = (role: DemoRole) => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
    writeDemoRole(role)
    setDemoRole(role)
  }

  const exitDemo = () => {
    clearDemoRole()
    setDemoRole(null)
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginRequest(email, password)
      const nextSession: AuthSession = { ...response, remember: false }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      exitDemo()
      setSession(nextSession)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
    exitDemo()
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      try {
        sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, '1')
      } catch {
        // El aviso es opcional; el cierre de sesión continúa.
      }
      sessionStorage.removeItem(SESSION_KEY)
      setSession(null)
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  useEffect(() => {
    // Only the real session expires; the demo session has no expiry (a far-future delay would overflow setTimeout).
    if (!realSession) return

    const remainingTime = new Date(realSession.expiresAt).getTime() - Date.now()
    const timeout = window.setTimeout(logout, Math.max(remainingTime, 0))
    return () => window.clearTimeout(timeout)
  }, [realSession])

  return <AuthContext.Provider value={{ session, isAuthenticated: session !== null, isLoading, login, logout, isDemo: demoRole !== null, demoRole, enterDemo, exitDemo }}>{children}</AuthContext.Provider>
}
