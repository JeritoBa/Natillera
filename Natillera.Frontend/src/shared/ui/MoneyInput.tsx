import { useLayoutEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react'
import { formatMoneyInput, formatThousands, parsePastedMoney } from '@/shared/lib/money'

interface MoneyInputProps {
  id: string
  /** Digits only (whole pesos). */
  value: string
  onChange: (raw: string) => void
  placeholder?: string
  disabled?: boolean
  describedBy?: string
}

export function MoneyInput({ id, value, onChange, placeholder, disabled, describedBy }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)
  const [pasteError, setPasteError] = useState(false)
  const display = formatThousands(value)
  const errorId = `${id}-paste-error`

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current)
      pendingCaret.current = null
    }
  })

  const apply = (text: string, caret: number) => {
    const next = formatMoneyInput(text, caret)
    pendingCaret.current = next.caret
    if (inputRef.current) {
      inputRef.current.value = next.display
      inputRef.current.setSelectionRange(next.caret, next.caret)
    }
    setPasteError(false)
    onChange(next.raw)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    apply(event.target.value, event.target.selectionStart ?? event.target.value.length)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const { selectionStart, selectionEnd } = input
    if (selectionStart === null || selectionStart !== selectionEnd) return
    if (event.key === 'Backspace' && input.value[selectionStart - 1] === '.') input.setSelectionRange(selectionStart - 1, selectionStart - 1)
    if (event.key === 'Delete' && input.value[selectionStart] === '.') input.setSelectionRange(selectionStart + 1, selectionStart + 1)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const parsed = parsePastedMoney(event.clipboardData.getData('text'))
    if (parsed === null) { setPasteError(true); return }
    const input = event.currentTarget
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    apply(input.value.slice(0, start) + parsed + input.value.slice(end), start + parsed.length)
  }

  return (
    <div>
      <div className="relative">
        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4e7460] mono pointer-events-none">$</span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={[describedBy, pasteError ? errorId : undefined].filter(Boolean).join(' ') || undefined}
          className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm mono"
        />
      </div>
      <p id={errorId} aria-live="polite" className={`text-xs text-[#c0392b]${pasteError ? ' mt-1' : ''}`}>{pasteError ? 'Pega solo el valor en pesos, sin decimales.' : ''}</p>
    </div>
  )
}
