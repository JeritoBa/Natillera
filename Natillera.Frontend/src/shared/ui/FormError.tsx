import { useEffect, useRef } from 'react'

interface FormErrorProps {
  message: string | null
  /** Changes on every submit so an identical message is brought into view again. */
  revision?: number
}

// UI-12: the error of a modal form is always brought into view (the box sits at the bottom of a scrollable modal).
export function FormError({ message, revision }: FormErrorProps) {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!message) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [message, revision])

  if (!message) return null
  return <p ref={ref} role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{message}</p>
}
