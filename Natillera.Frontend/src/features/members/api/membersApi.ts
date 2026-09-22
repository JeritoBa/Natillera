import { apiRequest } from '@/shared/api/apiClient'
import type { Member, MemberFormValues } from '@/features/members/model/memberTypes'

export const getMembers = (token: string) => apiRequest<Member[]>('/api/members', { token })

export const createMember = (token: string, values: MemberFormValues) =>
  apiRequest<Member>('/api/members', { method: 'POST', token, body: JSON.stringify(values) })

export const updateMember = (token: string, id: string, values: MemberFormValues) =>
  apiRequest<Member>(`/api/members/${id}`, { method: 'PUT', token, body: JSON.stringify(values) })

export const updateMemberStatus = (token: string, id: string, isActive: boolean) =>
  apiRequest<Member>(`/api/members/${id}/status`, { method: 'PATCH', token, body: JSON.stringify({ isActive }) })
