// Whole-peso money input helpers (UI-08). The page state holds digits only; "." is display-only.

const MAX_DIGITS = 12

/** Keeps only digits, drops leading zeros (leaving "0") and caps the length. */
export function digitsOnly(text: string): string {
  const digits = text.replace(/\D/g, '')
  if (!digits) return ''
  const trimmed = digits.replace(/^0+(?=\d)/, '')
  return trimmed.slice(0, MAX_DIGITS)
}

/** "50000" -> "50.000" */
export function formatThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Reformats typed text and keeps the caret after the same number of digits. */
export function formatMoneyInput(text: string, caret: number): { raw: string; display: string; caret: number } {
  const raw = digitsOnly(text)
  const display = formatThousands(raw)
  const digitsBeforeCaret = Math.min(text.slice(0, caret).replace(/\D/g, '').length, raw.length)
  let position = 0
  let seen = 0
  while (position < display.length && seen < digitsBeforeCaret) {
    if (display[position] !== '.') seen++
    position++
  }
  return { raw, display, caret: position }
}

/** Parses pasted text into digits, or null when it is not a whole-peso amount. */
export function parsePastedMoney(text: string): string | null {
  const cleaned = text.replace(/COP/gi, '').replace(/[$\s]/g, '')
  if (!cleaned) return null
  let integerPart: string
  const decimals = /^(\d+(?:[.,]\d{3})*)[.,](\d{1,2})$/.exec(cleaned)
  if (/^\d+$/.test(cleaned) || /^\d{1,3}(?:[.,]\d{3})+$/.test(cleaned)) {
    integerPart = cleaned
  } else if (decimals) {
    if (!/^0+$/.test(decimals[2])) return null
    integerPart = decimals[1]
  } else {
    return null
  }
  const digits = digitsOnly(integerPart)
  return digits || null
}

export function toMoneyInputValue(amount: number): string {
  return Number.isFinite(amount) ? String(Math.round(amount)) : ''
}
