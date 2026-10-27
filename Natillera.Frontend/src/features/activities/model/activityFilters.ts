import type { ActivityListItem, ActivityStatus } from '@/features/activities/api/activitiesApi'
import { parseMonthKey } from '@/shared/lib/urlFilterParams'

// UI-06: the month filter uses startDate.slice(0, 7).
export const activityStartMonth = (activity: Pick<ActivityListItem, 'startDate'>) => activity.startDate.slice(0, 7)

export type ActivityStatusFilter = 'all' | ActivityStatus

// UI-16: "all" means every status except Cancelled; cancelled activities only appear with the "Cancelled" status.
export const matchesActivityStatus = (activity: Pick<ActivityListItem, 'status'>, status: ActivityStatusFilter) =>
  status === 'all' ? activity.status !== 'Cancelled' : activity.status === status

type FilterableActivity = Pick<ActivityListItem, 'startDate' | 'status'>

export function filterActivities<T extends FilterableActivity>(activities: T[], month: 'all' | string, status: ActivityStatusFilter = 'all'): T[] {
  return activities.filter(activity =>
    (month === 'all' || activityStartMonth(activity) === month)
    && matchesActivityStatus(activity, status))
}

// UI-14 / UI-16: the status buttons count the activities left by the month filter, not the status itself; "all" excludes cancelled.
export function activityStatusCounts(activities: FilterableActivity[], month: 'all' | string): Record<ActivityStatusFilter, number> {
  const counts: Record<ActivityStatusFilter, number> = { all: 0, Pending: 0, Finished: 0, Cancelled: 0 }
  for (const activity of activities.filter(item => month === 'all' || activityStartMonth(item) === month)) {
    counts[activity.status] += 1
    if (activity.status !== 'Cancelled') counts.all += 1
  }
  return counts
}

// UI-15: filters come from the URL; anything unknown means "Todas".
export const parseActivityMonthFilter = parseMonthKey
export const parseActivityStatusFilter = (value: string | null | undefined): ActivityStatusFilter =>
  value === 'Pending' || value === 'Finished' || value === 'Cancelled' ? value : 'all'
