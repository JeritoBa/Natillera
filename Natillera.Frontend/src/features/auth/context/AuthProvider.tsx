import { useEffect, useState, type ReactNode } from 'react'
import { loginRequest } from '@/features/auth/services/authApi'
import { UNAUTHORIZED_EVENT } from '@/shared/api/apiClient'
import { SESSION_EXPIRED_NOTICE_KEY, type AuthSession } from '@/features/auth/model/authTypes'
import { AuthContext } from '@/features/auth/context/authContext'

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
  const [session, setSession] = useState<AuthSession | null>(readSession)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginRequest(email, password)
      const nextSession: AuthSession = { ...response, remember: false }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
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
    if (!session) return

    const remainingTime = new Date(session.expiresAt).getTime() - Date.now()
    const timeout = window.setTimeout(logout, Math.max(remainingTime, 0))
    return () => window.clearTimeout(timeout)
  }, [session])

  return <AuthContext.Provider value={{ session, isAuthenticated: session !== null, isLoading, login, logout }}>{children}</AuthContext.Provider>
}
