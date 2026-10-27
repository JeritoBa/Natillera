import { actions, entityTypes } from '@/features/audit/model/labels'
import { parseIsoDate, parseOneOf } from '@/shared/lib/urlFilterParams'

// UI-15: filters come from the URL; unknown entities/actions mean "Todas" and an invalid date means "no date".
export const parseLogEntityFilter = parseOneOf(entityTypes)
export const parseLogActionFilter = parseOneOf(actions)
export const parseLogDateFilter = parseIsoDate

// AUD-04: the server filters the audit log. `filterLogs` mirrors that contract for the public demo (DEMO-02):
// Colombia dates (UTC-5), q = user full name or entity id (case-insensitive, not accent-insensitive) or, when it is digits only, the exact old/new amount.
interface FilterableLog { entityType: string, action: string, occurredAt: string, userName: string, entityId: string, oldValue: number | null, newValue: number | null }
export interface LogFilterParams { q: string, entity: 'all' | string, action: 'all' | string, from: string, to: string }

const bogotaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' })
export const logDayKey = (occurredAt: string) => bogotaDay.format(new Date(occurredAt))

export function filterLogs<T extends FilterableLog>(logs: T[], { q, entity, action, from, to }: LogFilterParams): T[] {
  const term = q.trim().toLowerCase()
  const amount = /^-?\d{1,16}$/.test(term) ? Number(term) : null
  return logs.filter(log => {
    if (entity !== 'all' && log.entityType !== entity) return false
    if (action !== 'all' && log.action !== action) return false
    const day = logDayKey(log.occurredAt)
    if (from && day < from) return false
    if (to && day > to) return false
    if (!term) return true
    return log.userName.toLowerCase().includes(term)
      || log.entityId.toLowerCase().includes(term)
      || (amount !== null && (log.oldValue === amount || log.newValue === amount))
  })
}
