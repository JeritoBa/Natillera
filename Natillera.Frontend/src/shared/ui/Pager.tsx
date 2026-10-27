interface PagerProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

// UI-17: "Anterior · Página P de T · Siguiente". Buttons are >= 40 px and wrap full width at 320 px.
export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1 || page > totalPages) return null // past the end the page shows its own "Ir a la primera página"
  const button = 'btn-ghost px-4 min-h-10 rounded-lg text-sm font-medium flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed'
  return <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-3 border-t" style={{ borderColor: '#eef4f0' }}>
    <p aria-live="polite" className="order-first w-full text-center text-xs text-[#4e7460] sm:order-none sm:w-auto sm:text-sm">Página {page} de {totalPages}</p>
    <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className={`${button} order-1 sm:-order-1`}>Anterior</button>
    <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={`${button} order-2`}>Siguiente</button>
  </nav>
}
