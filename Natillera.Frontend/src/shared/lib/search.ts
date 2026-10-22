// Case- and accent-insensitive text normalizer for client-side search. Callers trim the term.
export const normalizeSearch = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
