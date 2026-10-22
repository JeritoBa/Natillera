const toneClass = { default: 'text-[#0c1a12]', positive: 'text-[#0a6635]', negative: 'text-[#c0392b]' }

// Centred label and value with a uniform height. The tone only changes the text colour (UI-02).
export function StatCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: keyof typeof toneClass }) {
  return <div className="stat-card rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-1 min-h-[84px]">
    <dt className="text-xs leading-tight text-[#4e7460]">{label}</dt>
    <dd className={`mono text-base sm:text-lg font-bold leading-none ${toneClass[tone]}`}>{value}</dd>
  </div>
}
