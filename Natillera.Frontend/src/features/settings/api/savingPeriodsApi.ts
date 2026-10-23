import { apiRequest } from '@/shared/api/apiClient'
import type { SavingPeriod } from '@/features/settings/model/savingPeriod'

export const getSavingPeriods = (token: string) => apiRequest<SavingPeriod[]>('/api/saving-periods', { token })
