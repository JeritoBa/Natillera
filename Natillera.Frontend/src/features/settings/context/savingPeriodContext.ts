import { createContext } from 'react'
import type { PeriodNotice, SavingPeriod } from '@/features/settings/model/savingPeriod'

export interface SavingPeriodContextValue {
  periods: SavingPeriod[]
  selected: SavingPeriod | null
  status: 'loading' | 'ready' | 'error'
  error: unknown
  notice: PeriodNotice
  noticeDismissed: boolean
  select: (id: string) => void
  dismissNotice: () => void
  reload: () => void
}

export const SavingPeriodContext = createContext<SavingPeriodContextValue | null>(null)
