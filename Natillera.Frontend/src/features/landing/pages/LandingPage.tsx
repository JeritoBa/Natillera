import { Link } from 'react-router-dom'
import { BrandLogo } from '@/shared/ui/BrandLogo'
import { WHATSAPP_URL } from '@/shared/lib/contact'
import { formatCurrency } from '@/shared/lib/formatters'
import { LandingIcon } from '@/features/landing/components/LandingIcons'
import { MonthFlow } from '@/features/landing/components/MonthFlow'
import { MemberPreview } from '@/features/landing/components/MemberPreview'

const steps = [
  { icon: LandingIcon.Cuota, title: 'Cada uno paga su cuota', desc: 'El administrador registra la cuota de cada miembro. Si alguien se atrasa, la cuota queda pendiente y esa persona lo ve apenas entra.', tag: 'Entra al fondo', badge: 'badge-positive' },
  { icon: LandingIcon.Presta, title: 'La plata se presta adentro', desc: 'Si un miembro necesita plata, se le presta del fondo. Paga un interés cada mes sobre lo que todavía debe y abona al capital cuando puede, nunca más de lo que debe.', tag: 'Sale del fondo', badge: 'badge-neutral' },
  { icon: LandingIcon.Reparto, title: 'Los intereses se reparten', desc: 'Los intereses no se los queda un banco: se reparten en partes iguales entre los miembros activos.', tag: 'Entra al fondo', badge: 'badge-positive' },
  { icon: LandingIcon.Venta, title: 'Vendemos juntos', desc: 'La natillera compra productos, cada miembro recibe unidades para vender y la ganancia de lo que vende queda a su nombre.', tag: 'Sale y vuelve con ganancia', badge: 'badge-neutral' },
  { icon: LandingIcon.Libreta, title: 'Todo queda anotado', desc: 'Cada peso que entra o sale queda como un movimiento con fecha y descripción. Si algo se registró mal no se borra: se anula, y queda la huella.', tag: 'Queda registrado', badge: 'badge-neutral' },
]

const memberViews = [
  { term: 'Cuánto hay disponible', desc: 'La plata que hay hoy en caja, calculada a partir de los movimientos. Nadie la escribe a mano.', preview: <MemberPreview.Available /> },
  { term: 'Cuánto llevas ahorrado y ganado', desc: 'Tus cuotas pagadas, tu ganancia en actividades y tu parte de los intereses de los préstamos.', preview: <MemberPreview.Saved /> },
  { term: 'Tus cuotas pendientes', desc: 'Si debes alguna cuota, te aparece un aviso apenas entras.', preview: <MemberPreview.Pending /> },
  { term: 'Todos los movimientos', desc: 'La lista completa de lo que entra y sale, con el detalle de cada uno.', preview: <MemberPreview.Movements /> },
  { term: 'Los préstamos', desc: 'Cuánto se prestó, cuánto se ha abonado y qué intereses faltan por pagar.', preview: <MemberPreview.Loans /> },
  { term: 'Actividades y ranking de ventas', desc: 'Qué se está vendiendo, cuántas unidades tiene cada quien y el top 10 de quienes más han ganado.', preview: <MemberPreview.Ranking /> },
]

const gains = [
  { icon: LandingIcon.Cuota, lead: 'Un ahorro que sí se cumple.', rest: 'La cuota de cada mes te ayuda a guardar aunque el mes venga apretado.' },
  { icon: LandingIcon.Presta, lead: 'Préstamos sin bancos.', rest: 'Si necesitas plata, se te presta del fondo, y los intereses se quedan en la familia.' },
  { icon: LandingIcon.Reparto, lead: 'Tu parte de los intereses.', rest: 'Lo que pagan los préstamos se reparte entre todos los miembros activos.' },
  { icon: LandingIcon.Venta, lead: 'Ganancia por vender.', rest: 'Lo que ganas en las actividades de venta queda a tu nombre.' },
  { icon: LandingIcon.Libreta, lead: 'Cuentas claras.', rest: 'Puedes ver cuando quieras cuánto hay y en qué se ha movido cada peso.' },
]

const asks = [
  'Pagar tu cuota cada mes.',
  'Si pides un préstamo, pagar los intereses cada mes y abonar al capital.',
  'Responder por las unidades que recibes para vender.',
]

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c5c38]'
const CONTAINER = 'max-w-6xl mx-auto px-6 md:px-12'
const EYEBROW = 'mono text-xs uppercase tracking-[0.14em] text-[#4e7460]'
const H2 = 'text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#0c1a12]'
const BODY = 'text-base md:text-lg leading-relaxed text-[#4e7460] max-w-[60ch]'

const WhatsAppHint = () => (
  <>
    <span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span>
    <span aria-hidden="true">↗</span>
  </>
)

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f7f5' }}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-[#0c5c38] focus:px-4 focus:py-2 focus:rounded-lg focus:outline-2 focus:outline-[#0c5c38]">Saltar al contenido</a>

      <header className="bg-white border-b border-[#d6e8dc]">
        <div className={`${CONTAINER} flex items-center justify-between py-4 md:py-5`}>
          <BrandLogo className="h-8 sm:h-10 w-auto" />
          <nav aria-label="Principal" className="flex items-center gap-1 md:gap-2">
            <a href="#que-es" className={`hidden md:inline-flex px-3 min-h-11 items-center text-sm text-[#4e7460] hover:text-[#0c1a12] rounded ${FOCUS}`}>Qué es</a>
            <a href="#como-funciona" className={`hidden md:inline-flex px-3 min-h-11 items-center text-sm text-[#4e7460] hover:text-[#0c1a12] rounded ${FOCUS}`}>Cómo funciona</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`hidden sm:inline-flex btn-ghost px-4 min-h-11 items-center gap-1 rounded-lg text-sm ${FOCUS}`}>Quiero unirme <WhatsAppHint /></a>
            <Link to="/login" className={`btn-primary px-5 min-h-11 inline-flex items-center rounded-lg text-sm ${FOCUS}`}>Ingresar</Link>
          </nav>
        </div>
      </header>

      <main id="contenido">
        <section aria-labelledby="hero-title">
          <div className={`${CONTAINER} pt-12 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-12 gap-12 lg:gap-10 items-start`}>
            <div className="lg:col-span-7 fade-up">
              <h1 id="hero-title" className="text-[2.5rem] sm:text-5xl lg:text-[4.25rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0c1a12]">
                Familia que ahorra junta,{' '}<br className="hidden sm:block" /><span className="text-[#0c5c38]">prospera junta.</span>
              </h1>
              <p className={`${BODY} mt-6`}>
                Aquí llevamos las cuentas de nuestra natillera: las cuotas de cada mes, los préstamos entre nosotros y lo que ganamos vendiendo juntos. Todo anotado y a la vista de todos.
              </p>
              <div className="mt-10 grid sm:grid-cols-2">
                <div className="pt-5 sm:pr-6">
                  <p className="text-sm font-semibold text-[#0c1a12]">¿Ya eres parte?</p>
                  <p className="text-sm text-[#4e7460] mt-1">Mira cuánto hay, cuánto llevas y qué te falta por pagar.</p>
                  <Link to="/login" className={`btn-primary mt-4 inline-flex items-center min-h-11 px-6 rounded-lg text-sm ${FOCUS}`}>Ingresar a mi natillera</Link>
                </div>
                <div className="pt-5 mt-2 sm:mt-0 sm:pl-6">
                  <p className="text-sm font-semibold text-[#0c1a12]">¿Todavía no?</p>
                  <p className="text-sm text-[#4e7460] mt-1">Te contamos cómo funciona y cómo entrar.</p>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`btn-ghost mt-4 inline-flex items-center gap-2 min-h-11 px-5 rounded-lg text-sm ${FOCUS}`}>Quiero unirme <WhatsAppHint /></a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 lg:pt-6">
              <figure className="fade-up-2" aria-labelledby="ejemplo-caption">
                <span className="badge-neutral inline-block px-2 py-1 rounded uppercase">Ejemplo · datos ficticios</span>
                <div className="mt-3 rounded-xl px-5 pt-5 pb-10 lg:px-6 lg:pt-6 lg:pb-14 text-white bg-[#0c5c38]">
                  <p className="text-sm text-[#cfe8da]">Dinero disponible</p>
                  <p className="mono font-bold text-3xl mt-2 break-words">{formatCurrency(2350000)}</p>
                  <p className="text-sm text-[#cfe8da] mt-2">Lo que hay hoy en caja para prestar o invertir.</p>
                </div>
                <div className="relative bg-white border border-[#0c5c38] rounded-xl p-5 -mt-4 mx-3 lg:-mt-8 lg:ml-10 lg:mr-0 shadow-[6px_6px_0_0_#d6e8dc]">
                  <p className="text-sm font-semibold text-[#0c1a12]">Mis ahorros</p>
                  <p className="mono text-2xl font-bold text-[#0a6635]">{formatCurrency(1240000)}</p>
                  <p className="text-xs text-[#4e7460]">Lo que has aportado más lo que has ganado</p>
                  <dl className="mt-3 space-y-2">
                    <div className="flex justify-between border-t border-[#eef4f0] pt-2 text-sm"><dt className="text-[#4e7460]">Cuotas pagadas</dt><dd className="mono text-[#0c1a12]">{formatCurrency(1100000)}</dd></div>
                    <div className="flex justify-between border-t border-[#eef4f0] pt-2 text-sm"><dt className="text-[#4e7460]">Ganancia en actividades</dt><dd className="mono text-[#0a6635]">{formatCurrency(85000)}</dd></div>
                    <div className="flex justify-between border-t border-[#eef4f0] pt-2 text-sm"><dt className="text-[#4e7460]">Rendimientos</dt><dd className="mono text-[#0a6635]">{formatCurrency(55000)}</dd></div>
                  </dl>
                  <p className="mt-3 rounded-lg border border-[#f3dc9a] bg-[#fef6dc] px-3 py-2 text-sm text-[#7a5600]">Tienes 1 cuota pendiente.</p>
                </div>
                <figcaption id="ejemplo-caption" className="mt-3 text-xs text-[#4e7460]">Así se ve tu resumen al entrar. Las cifras son de ejemplo, no son de la natillera.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="que-es" aria-labelledby="que-es-title" className="relative overflow-hidden bg-white border-y border-[#d6e8dc] scroll-mt-6">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="pointer-events-none select-none absolute -left-16 bottom-[-4rem] w-72 md:w-96 opacity-[0.06]" />
          <div className={`${CONTAINER} relative py-16 md:py-24 grid lg:grid-cols-12 gap-8`}>
            <div className="lg:col-span-4">
              <p className={EYEBROW}>Para quien no la conoce</p>
              <h2 id="que-es-title" className={`${H2} mt-3`}>¿Qué es una natillera?</h2>
            </div>
            <div className="lg:col-span-8 space-y-5">
              <p className={BODY}>Es un ahorro en grupo, de los de toda la vida en Colombia. Cada mes, cada miembro pone su cuota en un fondo común.</p>
              <p className={BODY}>Ese fondo no se queda quieto: se les presta a los mismos miembros con un interés acordado, y se usa para comprar productos que vendemos entre todos. Lo que se gana vuelve al grupo.</p>
              <p className="text-2xl md:text-3xl font-bold leading-snug text-[#0c5c38] tracking-[-0.01em] border-l-4 border-[#0c5c38] pl-5 mt-8">Es como el marranito de la casa, pero de toda la familia.</p>
            </div>
          </div>
        </section>

        <section id="como-funciona" aria-labelledby="mes-title" className="scroll-mt-6">
          <div className={`${CONTAINER} py-16 md:py-24`}>
            <p className={EYEBROW}>Paso a paso</p>
            <h2 id="mes-title" className={`${H2} mt-3`}>Así funciona un mes en la natillera</h2>
            <p className={`${BODY} mt-3`}>Sin letra menuda: esto es lo que pasa con la plata.</p>
            <MonthFlow />
            <ul className="mt-10 border-t border-[#0c1a12]">
              {steps.map(step => (
                <li key={step.title} className="grid md:grid-cols-12 gap-x-4 gap-y-2 py-6 border-b border-[#d6e8dc] items-start">
                  <h3 className="text-lg font-semibold text-[#0c1a12] md:col-span-5 flex items-center gap-3">
                    <span aria-hidden="true" className="shrink-0 w-2 h-2 rounded-full bg-[#0c5c38]" />
                    <span className="shrink-0 inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#ebf2ed] text-[#0c5c38]">
                      <step.icon className="w-8 h-8 md:w-9 md:h-9" />
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-[#4e7460] text-sm md:text-base leading-relaxed pl-[5.25rem] md:pl-0 md:col-span-4">{step.desc}</p>
                  <div className="pl-[5.25rem] md:pl-0 md:col-span-3 md:text-right">
                    <span className={`mono text-xs font-semibold px-2 py-1 rounded inline-block md:whitespace-nowrap ${step.badge}`}>{step.tag}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="miembros-title" className="bg-white border-y border-[#d6e8dc]">
          <div className={`${CONTAINER} py-16 md:py-24 grid lg:grid-cols-12 gap-10`}>
            <div className="lg:col-span-5 lg:sticky lg:top-8 self-start">
              <p className={EYEBROW}>Si ya eres parte</p>
              <h2 id="miembros-title" className={`${H2} mt-3`}>Lo que ves cuando entras</h2>
              <p className={`${BODY} mt-4`}>Tus cuentas, sin tener que preguntarle a nadie.</p>
              <Link to="/login" className={`btn-primary mt-6 inline-flex min-h-11 items-center px-6 rounded-lg text-sm ${FOCUS}`}>Ingresar a mi natillera</Link>
              <p className="mt-3 text-xs text-[#4e7460]">Entras con el correo y la contraseña que te dio el administrador.</p>
              <div aria-hidden="true" className="mt-10 lg:mt-12 inline-flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border border-[#d6e8dc] shadow-[5px_5px_0_0_#ebf2ed]">
                <span className="inline-flex items-center justify-center w-[5.25rem] h-[5.25rem] md:w-24 md:h-24 rounded-full border border-dashed border-[#0c5c38]/35">
                  <img src="/favicon.svg" alt="" className="w-12 h-12 md:w-14 md:h-14 select-none" />
                </span>
              </div>
            </div>
            <div className="lg:col-span-7">
              <p className="badge-neutral inline-block px-2 py-1 rounded uppercase">Vistas previas · datos ficticios</p>
              <dl className="mt-4 grid sm:grid-cols-2 gap-x-8">
                {memberViews.map(item => (
                  <div key={item.term} className="py-5 border-t border-[#eef4f0]">
                    <dt className="font-semibold text-[#0c1a12]">{item.term}</dt>
                    <dd className="text-sm text-[#4e7460] mt-1 leading-relaxed">{item.desc}</dd>
                    <div aria-hidden="true" className="mt-3 rounded-lg border border-[#eef4f0] bg-[#f8fbf8] p-3">{item.preview}</div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section aria-labelledby="unirse-title">
          <div className={`${CONTAINER} py-16 md:py-24`}>
            <p className={EYEBROW}>Si estás pensando en entrar</p>
            <h2 id="unirse-title" className={`${H2} mt-3`}>Lo que ganas, y lo que te pedimos</h2>
            <div className="mt-10 grid lg:grid-cols-12 gap-10 lg:gap-12">
              <div className="lg:col-span-7">
                <h3 className="mono text-xs uppercase tracking-[0.14em] text-[#0a6635]">Lo que ganas</h3>
                <ul className="mt-3">
                  {gains.map(gain => (
                    <li key={gain.lead} className="py-4 border-t border-[#d6e8dc] text-[#4e7460] grid grid-cols-[2rem_1fr] gap-4 items-start">
                      <gain.icon className="w-8 h-8 text-[#0c5c38]" />
                      <span><strong className="text-[#0c1a12] font-semibold">{gain.lead}</strong> {gain.rest}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative overflow-hidden lg:col-span-5 rounded-xl border border-[#d6e8dc] bg-white self-start">
                <div aria-hidden="true" className="h-4 bg-[#ebf2ed] bg-[radial-gradient(circle,#f5f7f5_3.5px,transparent_4px)] bg-[length:22px_16px] bg-[position:center]" />
                <div aria-hidden="true" className="absolute top-4 bottom-0 left-10 w-px bg-[#0c5c38]/25" />
                <div className="pl-14 pr-6 pt-5 pb-6">
                  <h3 className="mono text-xs uppercase tracking-[0.14em] text-[#4e7460]">Lo que te pedimos</h3>
                  <ol className="mt-3 list-none text-sm text-[#0c1a12] leading-8 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,#e3eee7_31px,#e3eee7_32px)]">
                    {asks.map((ask, index) => (
                      <li key={ask} className="relative"><span className="mono text-xs leading-8 text-[#4e7460] absolute top-0 -left-9">{index + 1}.</span>{ask}</li>
                    ))}
                  </ol>
                  <div aria-hidden="true" className="mt-4 ml-auto w-24 h-24 rounded-full border-2 border-[#0c5c38] text-[#0c5c38] flex flex-col items-center justify-center -rotate-6 opacity-80">
                    <img src="/favicon.svg" alt="" aria-hidden="true" className="w-7 h-7" />
                    <span className="mono text-[10px] uppercase tracking-[0.14em] mt-1">Trato hecho</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-title" className="relative overflow-hidden bg-[#0c5c38] text-white">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="pointer-events-none select-none absolute -right-12 -bottom-20 w-64 md:w-80 brightness-0 invert opacity-[0.07]" />
          <div className={`${CONTAINER} relative py-14 md:py-16 grid md:grid-cols-12 gap-6 items-end`}>
            <div className="md:col-span-8">
              <h2 id="cta-title" className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-white">¿Quieres entrar a la natillera?</h2>
              <p className="text-[#cfe8da] mt-3 max-w-[52ch]">Escríbenos por WhatsApp y te contamos cómo funciona la cuota, cuándo se paga y cómo empezar.</p>
            </div>
            <div className="md:col-span-4 md:justify-self-end flex flex-col items-start md:items-end gap-3">
              <div aria-hidden="true" className="hidden md:block rounded-2xl rounded-br-sm bg-white px-4 py-3 text-sm text-[#0c1a12] shadow-[3px_3px_0_0_rgba(0,0,0,0.12)]">
                <p className="mono text-[10px] uppercase tracking-[0.14em] text-[#4e7460]">Tu mensaje</p>
                Quiero unirme a la natillera
              </div>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 whitespace-nowrap min-h-11 px-6 rounded-lg text-sm font-semibold bg-white text-[#0c5c38] hover:bg-[#ebf2ed] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Escribir por WhatsApp <WhatsAppHint /></a>
              <Link to="/login" className="text-sm text-white underline underline-offset-4 min-h-11 inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">¿Ya eres miembro? Ingresa aquí</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d6e8dc]">
        <div className={`${CONTAINER} py-6 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-[#4e7460]`}>
          <span className="inline-flex items-center gap-2"><img src="/favicon.svg" alt="" aria-hidden="true" className="w-4 h-4" />Natillera Gallego Nanclares · Colombia</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
