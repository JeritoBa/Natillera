import { parseMonthKey } from '@/shared/lib/urlFilterParams'

// UI-15: the month filter comes from the URL; anything that is not YYYY-MM means "Todos".
export const parseActivityMonthFilter = parseMonthKey
