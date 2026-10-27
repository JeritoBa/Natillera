// UI-17: pure helpers behind the paginated lists (transactions, audit log).

// A positive integer; anything else (missing, 0, negative, decimal, text) means page 1.
export function parsePageParam(value: string | null | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

// "Mostrando A–B de N": from/to are 0 when there is nothing; totalPages is at least 1.
export function pageRange(page: number, pageSize: number, total: number): { from: number, to: number, totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0 || (page - 1) * pageSize >= total) return { from: 0, to: 0, totalPages }
  return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), totalPages }
}
