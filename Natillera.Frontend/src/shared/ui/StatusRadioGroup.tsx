import { useId } from 'react'
import { Badge } from '@/shared/ui/Badge'

export interface StatusRadioOption<T extends string> {
  value: T
  /** Key understood by `Badge` (for example "pending" or "paid"). */
  badge: string
  hint?: string
  disabled?: boolean
}

interface StatusRadioGroupProps<T extends string> {
  name: string
  legend: string
  value: T
  onChange: (value: T) => void
  options: StatusRadioOption<T>[]
  disabled?: boolean
  note?: string
}

export function StatusRadioGroup<T extends string>({ name, legend, value, onChange, options, disabled, note }: StatusRadioGroupProps<T>) {
  const noteId = useId()
  return (
    <fieldset className="border-0 p-0 m-0 min-w-0" aria-describedby={note ? noteId : undefined}>
      <legend className="block text-sm font-medium text-[#0c1a12] mb-1.5 p-0">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <label
            key={option.value}
            className="flex items-start gap-2 min-h-11 px-3 py-2.5 rounded-lg border border-[#d6e8dc] bg-white cursor-pointer transition-colors has-[:checked]:border-[#0c5c38] has-[:checked]:bg-[#f3f8f5] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0c5c38] has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled || option.disabled}
              className="mt-0.5 h-4 w-4 accent-[#0c5c38]"
            />
            <span className="flex flex-col items-start gap-1 text-xs">
              <Badge status={option.badge} />
              {option.hint && <span className="text-[#4e7460]">{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {note && <p id={noteId} className="text-xs text-[#4e7460] mt-1.5">{note}</p>}
    </fieldset>
  )
}
