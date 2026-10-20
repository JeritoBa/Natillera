import type { Member } from '@/features/members/model/memberTypes'
import { normalizeSearch } from '@/shared/lib/search'

export type MemberStatusFilter = 'all' | 'active' | 'inactive'

export function filterMembers(members: Member[], term: string, status: MemberStatusFilter): Member[] {
  const query = normalizeSearch(term.trim())
  return members.filter(member => {
    if (status === 'active' && !member.isActive) return false
    if (status === 'inactive' && member.isActive) return false
    if (!query) return true
    return normalizeSearch(`${member.firstName} ${member.lastName} ${member.email} ${member.phone}`).includes(query)
  })
}

export function countMembersByStatus(members: Member[]) {
  const active = members.filter(member => member.isActive).length
  return { all: members.length, active, inactive: members.length - active }
}
