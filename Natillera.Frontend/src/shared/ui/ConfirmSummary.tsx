import { Badge } from '@/shared/ui/Badge'

interface ConfirmSummaryProps {
  title: string
  detail?: string
  amount?: string
  status?: string
}

// UI-13: record card shown at the top of ConfirmDialog (same look as the member status modal).
export function ConfirmSummary({ title, detail, amount, status }: ConfirmSummaryProps) {
  return (
    <div className="rounded-lg border border-[#d6e8dc] bg-[#f8fbf8] px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#0c1a12] truncate">{title}</p>
        {detail && <p className="text-xs text-[#4e7460] mono truncate">{detail}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {amount && <p className="text-sm mono text-[#0c1a12]">{amount}</p>}
        {status && <Badge status={status} />}
      </div>
    </div>
  )
}
