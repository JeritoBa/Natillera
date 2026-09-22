import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createMember, getMembers, updateMember, updateMemberStatus } from '@/features/members/api/membersApi'
import type { Member, MemberFormValues } from '@/features/members/model/memberTypes'
import { getFriendlyApiError } from '@/shared/api/apiError'

export function useMembers() {
  const { session } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try { setMembers(await getMembers(session.accessToken)) }
    catch (requestError) { setError(getFriendlyApiError(requestError)) }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadMembers() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadMembers])

  const create = async (values: MemberFormValues) => {
    if (!session) return
    const member = await createMember(session.accessToken, values)
    setMembers(current => [...current, member].sort((a, b) => a.lastName.localeCompare(b.lastName)))
  }

  const update = async (id: string, values: MemberFormValues) => {
    if (!session) return
    const member = await updateMember(session.accessToken, id, values)
    setMembers(current => current.map(item => item.id === id ? member : item))
  }

  const setStatus = async (id: string, isActive: boolean) => {
    if (!session) return
    const member = await updateMemberStatus(session.accessToken, id, isActive)
    setMembers(current => current.map(item => item.id === id ? member : item))
  }

  return { members, loading, error, create, update, setStatus, reload: loadMembers }
}
