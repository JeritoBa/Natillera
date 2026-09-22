import { apiRequest } from '@/shared/api/apiClient'
import type { LoginResponse } from '@/features/auth/model/authTypes'

export function loginRequest(email: string, password: string) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
