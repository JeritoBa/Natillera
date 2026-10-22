import { useContext } from 'react'
import { SavingPeriodContext } from '@/features/settings/context/savingPeriodContext'

export function useSavingPeriod() {
  const context = useContext(SavingPeriodContext)
  if (!context) throw new Error('useSavingPeriod must be used within SavingPeriodProvider')
  return context
}
