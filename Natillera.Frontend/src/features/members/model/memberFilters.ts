import type { Member } from '@/features/members/model/memberTypes'
import { normalizeSearch } from '@/shared/lib/search'

// UI-16: the members list shows only active members by default; inactive ones only with the "Inactivos" filter.
export type MemberStatusFilter = 'active' | 'inactive'

const matchesSearch = (member: Member, query: string) =>
  !query || normalizeSearch(`${member.firstName} ${member.lastName} ${member.email} ${member.phone}`).includes(query)

export function filterMembers(members: Member[], term: string, status: MemberStatusFilter): Member[] {
  const query = normalizeSearch(term.trim())
  return members.filter(member => member.isActive === (status === 'active') && matchesSearch(member, query))
}

export function countMembersByStatus(members: Member[]) {
  const active = members.filter(member => member.isActive).length
  return { active, inactive: members.length - active }
}

// UI-14: the status buttons count the members left by the search (it applies to both), not the status itself.
export const memberStatusCounts = (members: Member[], term: string) => {
  const query = normalizeSearch(term.trim())
  return countMembersByStatus(members.filter(member => matchesSearch(member, query)))
}

// UI-15: the status comes from the URL; "active" is the default (omitted) and anything unknown means "Activos".
export const parseMemberStatusFilter = (value: string | null | undefined): MemberStatusFilter => value === 'inactive' ? 'inactive' : 'active'
