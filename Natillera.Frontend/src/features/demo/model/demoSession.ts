import type { AuthSession, AuthUser } from '@/features/auth/model/authTypes'

export type DemoRole = 'Admin' | 'Member'

export const DEMO_ROLE_KEY = 'natillera.demo.role'
export const DEMO_WRITE_EVENT = 'natillera:demo-write'
export const DEMO_NOTICE = 'Modo demo: los cambios no se guardan.'

// DEMO-05: the chosen role lives in sessionStorage (per tab) and never touches the real session key.
export function readDemoRole(): DemoRole | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const stored = sessionStorage.getItem(DEMO_ROLE_KEY)
    if (stored === null) return null
    if (stored === 'Admin' || stored === 'Member') return stored
    sessionStorage.removeItem(DEMO_ROLE_KEY)
    return null
  } catch {
    return null
  }
}

export function writeDemoRole(role: DemoRole) {
  try {
    sessionStorage.setItem(DEMO_ROLE_KEY, role)
  } catch {
    // Storage unavailable: the demo role simply is not persisted.
  }
}

export function clearDemoRole() {
  try {
    sessionStorage.removeItem(DEMO_ROLE_KEY)
  } catch {
    // Nothing to clear.
  }
}

export function buildDemoSession(user: AuthUser): AuthSession {
  return { accessToken: 'demo', expiresAt: '9999-12-31T00:00:00.000Z', user, remember: false }
}
