import { describe, expect, it } from 'vitest'
import { countMembersByStatus, filterMembers, memberStatusCounts } from '@/features/members/model/memberFilters'
import type { Member } from '@/features/members/model/memberTypes'

const m = (id: string, firstName: string, lastName: string, email: string, phone: string, isActive = true): Member =>
  ({ id, firstName, lastName, email, phone, role: 'Member', isActive })

const members: Member[] = [
  m('1', 'Ana', 'Gallego', 'ana@mail.com', '3001112233'),
  m('2', 'Luis', 'Gálvez', 'luis@correo.co', '3109998877', false),
  m('3', 'María', 'Peña', 'maria@mail.com', '3205554433'),
]

const ids = (list: Member[]) => list.map(x => x.id)

describe('filterMembers', () => {
  it('matches "gal" and "gál" accent-insensitively', () => {
    expect(ids(filterMembers(members, 'gal', 'all'))).toEqual(['1', '2'])
    expect(ids(filterMembers(members, 'gál', 'all'))).toEqual(['1', '2'])
  })

  it('matches "galv" against Gálvez', () => {
    expect(ids(filterMembers(members, 'galv', 'all'))).toEqual(['2'])
  })

  it('matches email and phone substrings', () => {
    expect(ids(filterMembers(members, 'correo.co', 'all'))).toEqual(['2'])
    expect(ids(filterMembers(members, '55544', 'all'))).toEqual(['3'])
  })

  it('trims the term', () => {
    expect(ids(filterMembers(members, '  pena  ', 'all'))).toEqual(['3'])
  })

  it('returns all members for an empty term, subject to status', () => {
    expect(filterMembers(members, '', 'all')).toHaveLength(3)
    expect(ids(filterMembers(members, '   ', 'active'))).toEqual(['1', '3'])
  })

  it('filters by status', () => {
    expect(ids(filterMembers(members, '', 'inactive'))).toEqual(['2'])
  })

  it('combines status and search with AND', () => {
    expect(ids(filterMembers(members, 'gal', 'active'))).toEqual(['1'])
    expect(filterMembers(members, 'pena', 'inactive')).toEqual([])
  })

  it('returns an empty list without matches', () => {
    expect(filterMembers(members, 'zzz', 'all')).toEqual([])
  })

  it('preserves order and does not mutate the input', () => {
    const copy = [...members]
    expect(ids(filterMembers(members, 'a', 'all'))).toEqual(['1', '2', '3'])
    expect(members).toEqual(copy)
  })
})

describe('countMembersByStatus', () => {
  it('counts the whole list', () => {
    expect(countMembersByStatus(members)).toEqual({ all: 3, active: 2, inactive: 1 })
    expect(countMembersByStatus([])).toEqual({ all: 0, active: 0, inactive: 0 })
  })
})

// UI-14
describe('memberStatusCounts', () => {
  it('equals the totals without a search', () => {
    expect(memberStatusCounts(members, '')).toEqual({ all: 3, active: 2, inactive: 1 })
  })

  it('counts only the members that match the search', () => {
    expect(memberStatusCounts(members, 'mail.com')).toEqual({ all: 2, active: 2, inactive: 0 })
    expect(memberStatusCounts(members, 'galvez')).toEqual({ all: 1, active: 0, inactive: 1 })
  })
})
