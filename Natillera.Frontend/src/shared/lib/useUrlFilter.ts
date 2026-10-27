import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { syncTextDraft, withParam, withoutParams, type TextDraft } from '@/shared/lib/urlFilterParams'

// UI-15: the URL is the single source of truth for selects, buttons and dates. History is replaced (it does not grow)
// and the URL is never rewritten on load: an invalid value just behaves as the default through `parse`.
export function useUrlParam<T extends string>(key: string, parse: (value: string | null) => T, defaultValue: T): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = parse(searchParams.get(key))
  const set = useCallback((next: T) => {
    setSearchParams(current => withParam(current, key, next, defaultValue), { replace: true })
  }, [setSearchParams, key, defaultValue])
  return [value, set]
}

// Free-text filter: filters instantly from local state and writes the URL (replace) after `delayMs`.
// Returns [text, setText, reset]; `reset` empties the text and cancels the pending write (clear the URL with useClearUrlParams).
export function useUrlTextParam(key: string, delayMs = 300): [string, (value: string) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlValue = searchParams.get(key) ?? ''
  const [draft, setDraft] = useState<TextDraft>({ text: urlValue, synced: urlValue })
  const current = syncTextDraft(draft, urlValue)
  // The timer must call the latest setter: setSearchParams captures the params of the render that created it.
  const setterRef = useRef(setSearchParams)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => { setterRef.current = setSearchParams })
  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const setText = (value: string) => {
    setDraft({ text: value, synced: current.synced })
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setterRef.current(params => withParam(params, key, value, ''), { replace: true })
    }, delayMs)
  }
  const reset = () => {
    window.clearTimeout(timerRef.current)
    setDraft({ text: '', synced: current.synced })
  }
  return [current.text, setText, reset]
}

// Removes every given filter param in ONE call (two setSearchParams calls in the same tick overwrite each other).
export function useClearUrlParams(keys: readonly string[]): () => void {
  const [, setSearchParams] = useSearchParams()
  return useCallback(() => {
    setSearchParams(current => withoutParams(current, keys), { replace: true })
  }, [setSearchParams, keys])
}
