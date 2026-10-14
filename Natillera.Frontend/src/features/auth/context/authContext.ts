import { createContext } from 'react'
import type { AuthSession } from '@/features/auth/model/authTypes'
import type { DemoRole } from '@/features/demo/model/demoSession'

export interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isDemo: boolean
  demoRole: DemoRole | null
  enterDemo: (role: DemoRole) => void
  exitDemo: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
