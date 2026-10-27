import { actions, entityTypes } from '@/features/audit/model/labels'
import { parseIsoDate, parseOneOf } from '@/shared/lib/urlFilterParams'

// UI-15: filters come from the URL; unknown entities/actions mean "Todas" and an invalid date means "no date".
export const parseLogEntityFilter = parseOneOf(entityTypes)
export const parseLogActionFilter = parseOneOf(actions)
export const parseLogDateFilter = parseIsoDate
