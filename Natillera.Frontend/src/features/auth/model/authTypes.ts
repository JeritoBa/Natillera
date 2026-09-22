export type UserRole = 'Admin' | 'Member'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
}

export interface LoginResponse {
  accessToken: string
  expiresAt: string
  user: AuthUser
}

export interface AuthSession extends LoginResponse {
  remember: false
}
