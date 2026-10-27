import { describe, expect, it } from 'vitest'
import { countMembersByStatus, filterMembers, memberStatusCounts, parseMemberStatusFilter } from '@/features/members/model/memberFilters'
import type { Member } from '@/features/members/model/memberTypes'

const m = (id: string, firstName: string, lastName: string, email: string, phone: string, isActive = true): Member =>
  ({ id, firstName, lastName, email, phone, role: 'Member', isActive })

const members: Member[] = [
  m('1', 'Ana', 'Gallego', 'ana@mail.com', '3001112233'),
  m('2', 'Luis', 'Gálvez', 'luis@correo.co', '3109998877', false),
  m('3', 'María', 'Peña', 'maria@mail.com', '3205554433'),
]

const ids = (list: Member[]) => list.map(x => x.id)

// UI-16: the list shows active members by default; inactive ones only with the "inactive" status.
describe('filterMembers', () => {
  it('matches "gal" and "gál" accent-insensitively, inside each status', () => {
    expect(ids(filterMembers(members, 'gal', 'active'))).toEqual(['1'])
    expect(ids(filterMembers(members, 'gál', 'inactive'))).toEqual(['2'])
  })

  it('matches "galv" against Gálvez (inactive)', () => {
    expect(ids(filterMembers(members, 'galv', 'inactive'))).toEqual(['2'])
    expect(filterMembers(members, 'galv', 'active')).toEqual([])
  })

  it('matches email and phone substrings', () => {
    expect(ids(filterMembers(members, 'correo.co', 'inactive'))).toEqual(['2'])
    expect(ids(filterMembers(members, '55544', 'active'))).toEqual(['3'])
  })

  it('trims the term', () => {
    expect(ids(filterMembers(members, '  pena  ', 'active'))).toEqual(['3'])
  })

  it('returns every member of the status for an empty term', () => {
    expect(ids(filterMembers(members, '   ', 'active'))).toEqual(['1', '3'])
    expect(ids(filterMembers(members, '', 'inactive'))).toEqual(['2'])
  })

  it('returns an empty list without matches', () => {
    expect(filterMembers(members, 'zzz', 'active')).toEqual([])
  })

  it('preserves order and does not mutate the input', () => {
    const copy = [...members]
    expect(ids(filterMembers(members, 'a', 'active'))).toEqual(['1', '3'])
    expect(members).toEqual(copy)
  })
})

describe('countMembersByStatus', () => {
  it('counts the whole list', () => {
    expect(countMembersByStatus(members)).toEqual({ active: 2, inactive: 1 })
    expect(countMembersByStatus([])).toEqual({ active: 0, inactive: 0 })
  })
})

// UI-14 / UI-16
describe('memberStatusCounts', () => {
  it('equals the totals without a search', () => {
    expect(memberStatusCounts(members, '')).toEqual({ active: 2, inactive: 1 })
  })

  it('counts only the members that match the search (it applies to both statuses)', () => {
    expect(memberStatusCounts(members, 'mail.com')).toEqual({ active: 2, inactive: 0 })
    expect(memberStatusCounts(members, 'galvez')).toEqual({ active: 0, inactive: 1 })
  })
})

// UI-15 / UI-16
describe('parseMemberStatusFilter', () => {
  it('defaults to active; only "inactive" selects the inactive members', () => {
    expect(parseMemberStatusFilter('inactive')).toBe('inactive')
    expect(parseMemberStatusFilter('active')).toBe('active')
    expect(parseMemberStatusFilter('Inactive')).toBe('active')
    expect(parseMemberStatusFilter('xyz')).toBe('active')
    expect(parseMemberStatusFilter(null)).toBe('active')
  })
})
