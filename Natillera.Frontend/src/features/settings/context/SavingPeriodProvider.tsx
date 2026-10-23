import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getSavingPeriods } from '@/features/settings/api/savingPeriodsApi'
import { SavingPeriodContext } from '@/features/settings/context/savingPeriodContext'
import { readStoredPeriodId, resolveSelectedPeriod, sortPeriodsNewestFirst, writeStoredPeriodId, type PeriodNotice, type SavingPeriod } from '@/features/settings/model/savingPeriod'
import { setSavingPeriodId } from '@/shared/api/apiClient'

const NOTICE_DISMISSED_KEY = 'natillera.savingPeriodNoticeDismissed'

const readNoticeDismissed = () => {
  try { return sessionStorage.getItem(NOTICE_DISMISSED_KEY) === '1' } catch { return false }
}

// PER-03: loads the periods once, resolves the selected one and sets the X-Saving-Id header before any page fetches.
export function SavingPeriodProvider({ children }: { children: ReactNode }) {
  const { session, isDemo } = useAuth()
  const token = session?.accessToken
  const [periods, setPeriods] = useState<SavingPeriod[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<PeriodNotice>('none')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<unknown>(null)
  const [noticeDismissed, setNoticeDismissed] = useState(readNoticeDismissed)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Demo mode never talks to the API and has no period.
    if (isDemo || !token) return
    let cancelled = false
    getSavingPeriods(token)
      .then(response => {
        if (cancelled) return
        const sorted = sortPeriodsNewestFirst(response)
        const resolved = resolveSelectedPeriod(sorted, readStoredPeriodId(), new Date().getFullYear())
        setSavingPeriodId(resolved.period?.id ?? null)
        setPeriods(sorted); setSelectedId(resolved.period?.id ?? null); setNotice(resolved.notice); setError(null); setStatus('ready')
      })
      .catch(requestError => { if (!cancelled) { setError(requestError); setStatus('error') } })
    return () => { cancelled = true; setSavingPeriodId(null) }
  }, [token, isDemo, attempt])

  const select = useCallback((id: string) => {
    setSavingPeriodId(id)
    writeStoredPeriodId(id)
    setSelectedId(id)
    setNotice('none')
  }, [])

  const dismissNotice = useCallback(() => {
    try { sessionStorage.setItem(NOTICE_DISMISSED_KEY, '1') } catch { /* Not persisted for the session. */ }
    setNoticeDismissed(true)
  }, [])

  const reload = useCallback(() => { setStatus('loading'); setAttempt(value => value + 1) }, [])

  const value = useMemo(() => ({
    periods,
    selected: isDemo ? null : periods.find(period => period.id === selectedId) ?? null,
    status: isDemo ? 'ready' as const : status,
    error,
    notice: isDemo ? 'none' as const : notice,
    noticeDismissed,
    select,
    dismissNotice,
    reload,
  }), [periods, selectedId, status, error, notice, noticeDismissed, isDemo, select, dismissNotice, reload])

  return <SavingPeriodContext.Provider value={value}>{children}</SavingPeriodContext.Provider>
}
