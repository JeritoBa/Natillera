import { formatCurrency } from '@/shared/lib/formatters'

const Available = () => (
  <div className="rounded-md bg-[#0c5c38] px-3 py-2">
    <p className="text-[11px] text-[#cfe8da]">Disponible</p>
    <p className="mono text-sm font-bold text-white">{formatCurrency(2350000)}</p>
  </div>
)

const Saved = () => (
  <div>
    <p className="mono text-sm font-bold text-[#0a6635]">{formatCurrency(1240000)}</p>
    <div className="mt-2 h-2 rounded-full overflow-hidden flex">
      <div className="bg-[#0c5c38]" style={{ width: '88%' }} />
      <div className="bg-[#117a45]" style={{ width: '7%' }} />
      <div className="bg-[#8fd1ad]" style={{ width: '5%' }} />
    </div>
    <p className="mt-1 text-[11px] text-[#4e7460]">Cuotas · Actividades · Intereses</p>
  </div>
)

const Pending = () => (
  <p className="rounded-md border border-[#f3dc9a] bg-[#fef6dc] px-2.5 py-1.5 text-xs text-[#7a5600]">1 cuota pendiente</p>
)

const Movements = () => (
  <div>
    <div className="flex justify-between text-xs pb-1.5"><span className="text-[#0c1a12]">Cuota mensual</span><span className="mono text-[#0a6635]">{`+ ${formatCurrency(100000)}`}</span></div>
    <div className="flex justify-between text-xs pt-1.5 border-t border-[#eef4f0]"><span className="text-[#0c1a12]">Préstamo</span><span className="mono text-[#c0392b]">{`− ${formatCurrency(500000)}`}</span></div>
  </div>
)

const Loans = () => (
  <div>
    <div className="flex justify-between text-[11px] text-[#4e7460]"><span>Abonado</span><span className="mono">{`${formatCurrency(300000)} de ${formatCurrency(500000)}`}</span></div>
    <div className="mt-1.5 h-1.5 rounded-full bg-[#eef4f0]"><div className="h-full rounded-full bg-[#0c5c38]" style={{ width: '60%' }} /></div>
  </div>
)

const ranking = [
  { pos: 1, name: 'Miembro A', amount: 120000, cls: 'bg-[#0c5c38] text-white' },
  { pos: 2, name: 'Miembro B', amount: 95000, cls: 'bg-[#dcf5e8] text-[#0a6635]' },
  { pos: 3, name: 'Miembro C', amount: 70000, cls: 'bg-[#dcf5e8] text-[#0a6635]' },
]

const Ranking = () => (
  <div className="space-y-1.5">
    {ranking.map(row => (
      <div key={row.pos} className="flex items-center gap-2 text-xs">
        <span className={`w-5 h-5 rounded-full mono text-[10px] inline-flex items-center justify-center ${row.cls}`}>{row.pos}</span>
        <span className="text-[#0c1a12]">{row.name}</span>
        <span className="mono ml-auto text-[#0c1a12]">{formatCurrency(row.amount)}</span>
      </div>
    ))}
  </div>
)

export const MemberPreview = { Available, Saved, Pending, Movements, Loans, Ranking }
