import { LandingIcon } from './LandingIcons'

const inflows = [
  'Las cuotas de cada mes',
  'Los abonos a los préstamos',
  'Los intereses de los préstamos',
  'Lo que vuelve de las ventas',
]
const outflows = [
  'Préstamos a los miembros',
  'Compra de productos para vender',
]

const Line = ({ text, dot }: { text: string; dot: string }) => (
  <li className="flex items-start gap-2.5 text-sm text-[#0c1a12]">
    <span aria-hidden="true" className={`mt-[0.45rem] w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
    {text}
  </li>
)

const Arrow = () => <LandingIcon.Flecha className="w-12 h-4 text-[#0c5c38] rotate-90 md:rotate-0 mx-auto" />

export function MonthFlow() {
  return (
    <figure className="mt-10" aria-labelledby="flujo-caption">
      <figcaption id="flujo-caption" className="sr-only">Cómo se mueve la plata del fondo común en un mes</figcaption>
      <div className="grid md:grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-4">
        <div className="rounded-xl border border-[#d6e8dc] bg-white p-5">
          <p id="flujo-entra" className="badge-positive mono text-xs font-semibold px-2 py-1 rounded inline-block">Entra al fondo</p>
          <ul aria-labelledby="flujo-entra" className="mt-3 space-y-2">
            {inflows.map(text => <Line key={text} text={text} dot="bg-[#0c5c38]" />)}
          </ul>
        </div>
        <Arrow />
        <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-white border-2 border-[#0c5c38] flex flex-col items-center justify-center">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="w-14 h-14" />
          <span className="font-bold text-[#0c1a12]" style={{ fontFamily: 'Outfit, sans-serif' }}>Fondo común</span>
        </div>
        <Arrow />
        <div className="rounded-xl border border-[#d6e8dc] bg-white p-5">
          <p id="flujo-sale" className="badge-neutral mono text-xs font-semibold px-2 py-1 rounded inline-block">Sale del fondo</p>
          <ul aria-labelledby="flujo-sale" className="mt-3 space-y-2">
            {outflows.map(text => <Line key={text} text={text} dot="bg-[#4e7460]" />)}
          </ul>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3 border-y border-dashed border-[#0c5c38]/40 py-3 text-sm text-[#0c1a12]">
        <LandingIcon.Libreta className="w-8 h-8 text-[#0c5c38] shrink-0" />
        <span>Todo queda anotado: cada peso que entra o sale es un movimiento con fecha.</span>
      </div>
    </figure>
  )
}
