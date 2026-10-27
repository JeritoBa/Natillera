// UI-15: pure helpers behind the URL-backed list filters (see useUrlFilter.ts).

// Sets one key and keeps the rest; the default value and '' remove the key so the URL stays clean.
export function withParam(current: URLSearchParams, key: string, value: string, defaultValue: string): URLSearchParams {
  const next = new URLSearchParams(current)
  if (value === '' || value === defaultValue) next.delete(key)
  else next.set(key, value)
  return next
}

// UI-17: changing a filter returns the list to page 1 IN THE SAME URL update (two setSearchParams calls in one tick overwrite each other).
export const PAGE_PARAM = 'page'
export function withFilterParam(current: URLSearchParams, key: string, value: string, defaultValue: string): URLSearchParams {
  return withoutParams(withParam(current, key, value, defaultValue), [PAGE_PARAM])
}

export function withoutParams(current: URLSearchParams, keys: readonly string[]): URLSearchParams {
  const next = new URLSearchParams(current)
  for (const key of keys) next.delete(key)
  return next
}

// YYYY-MM with a real month; anything else means "Todos".
export const parseMonthKey = (value: string | null | undefined): string =>
  value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : 'all'

// YYYY-MM-DD that exists in the calendar; anything else means "no date".
export function parseIsoDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? '' : value
}

// An id (userId) or "Todos"; whether it exists in the data is decided by the page (effective* logic).
export const parseIdParam = (value: string | null | undefined): string => value && value.trim() !== '' ? value : 'all'

export const parseOneOf = <T extends string>(values: readonly T[]) =>
  (value: string | null | undefined): T | 'all' => values.find(item => item === value) ?? 'all'

// Free-text filter: the text is local (instant) and the URL follows it with a delay.
export interface TextDraft { text: string, synced: string }

// Keeps the typed text while the URL has not caught up yet; adopts the URL when it changes on its own (Back, link).
export function syncTextDraft(draft: TextDraft, urlValue: string): TextDraft {
  if (draft.synced === urlValue) return draft
  if (urlValue === draft.text) return { text: draft.text, synced: urlValue }
  return { text: urlValue, synced: urlValue }
}
