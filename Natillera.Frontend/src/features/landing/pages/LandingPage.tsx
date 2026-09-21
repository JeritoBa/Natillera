import type { Page } from '@/shared/model/types'
import { Icon } from '@/shared/ui/Icon'

export function LandingPage({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <div className="min-h-screen" style={{ background: '#f5f7f5' }}>
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b" style={{ background: '#fff', borderColor: '#d6e8dc' }}>
        <div className="flex items-center gap-2.5">
          <Icon.Logo />
          <span className="text-[#0c1a12] font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>Natillera</span>
        </div>
        <button onClick={() => setPage('auth')} className="btn-primary px-5 py-2 rounded-lg text-sm">Ingresar</button>
      </nav>

      <section className="px-6 md:px-12 pt-16 pb-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 fade-up">
            <p className="text-xs font-mono uppercase tracking-widest text-[#0c5c38] mb-5">Ahorro colectivo familiar</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0c1a12] leading-[1.1] mb-6">
              Tu familia<br />ahorra junta,<br /><span className="text-[#0c5c38]">prospera junta.</span>
            </h1>
            <p className="text-[#4e7460] text-lg leading-relaxed mb-8 max-w-md">
              Organiza tu natillera de forma digital. Aportes mensuales, préstamos justos, transparencia total en cada peso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setPage('auth')} className="btn-primary px-7 py-3 rounded-lg text-sm">Comenzar gratis</button>
              <button onClick={() => setPage('auth')} className="btn-ghost px-7 py-3 rounded-lg text-sm">Ver demo</button>
            </div>
          </div>

          <div className="md:col-span-2 fade-up-2">
            <div className="rounded-2xl p-6" style={{ background: '#0c5c38', color: '#fff' }}>
              <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-5">Natillera · Sep 2026</p>
              <div className="space-y-5">
                <div><p className="text-xs opacity-60 mb-0.5">Total en el fondo</p><p className="text-3xl font-bold mono">$4.820.000</p></div>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs opacity-60 mb-0.5">Prestado</p><p className="text-xl font-semibold mono">$720K</p></div>
                  <div><p className="text-xs opacity-60 mb-0.5">Rendimiento</p><p className="text-xl font-semibold mono text-[#6ee8a4]">2.4%</p></div>
                  <div><p className="text-xs opacity-60 mb-0.5">Miembros</p><p className="text-xl font-semibold mono">9</p></div>
                  <div><p className="text-xs opacity-60 mb-0.5">Meses</p><p className="text-xl font-semibold mono">11</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t" style={{ borderColor: '#d6e8dc', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
          <p className="text-xs font-mono uppercase tracking-widest text-[#4e7460] mb-10">Qué incluye</p>
          <div className="divide-y" style={{ borderColor: '#eef4f0' }}>
            {[
              { num: '01', title: 'Cuotas mensuales', desc: 'Registra y controla cada aporte. Notifica a quien esté atrasado.' },
              { num: '02', title: 'Préstamos internos', desc: 'Aprueba créditos a miembros con tasas acordadas, seguimiento de saldo y vencimientos.' },
              { num: '03', title: 'Distribución de utilidades', desc: 'Calcula y registra los intereses ganados y cómo se reparten entre socios.' },
              { num: '04', title: 'Historial completo', desc: 'Cada peso entra y sale con fecha, responsable y descripción. Nada se pierde.' },
            ].map(feature => (
              <div key={feature.num} className="flex items-start gap-8 py-6">
                <span className="text-xs font-mono text-[#4e7460] pt-0.5 w-6 flex-shrink-0">{feature.num}</span>
                <div><h3 className="font-semibold text-[#0c1a12] mb-1">{feature.title}</h3><p className="text-[#4e7460] text-sm leading-relaxed">{feature.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 text-center" style={{ background: '#f5f7f5', borderTop: '1px solid #d6e8dc' }}>
        <h2 className="text-2xl md:text-3xl font-bold text-[#0c1a12] mb-3">¿Tu familia ya ahorra junta?</h2>
        <p className="text-[#4e7460] mb-7 max-w-md mx-auto">Empieza hoy. Sin costos ocultos, sin complicaciones.</p>
        <button onClick={() => setPage('auth')} className="btn-primary px-9 py-3 rounded-lg text-sm inline-block">Abrir mi natillera</button>
      </section>

      <footer className="text-center py-6 text-[#4e7460] text-xs border-t" style={{ borderColor: '#d6e8dc' }}>© 2026 Natillera Familiar · Colombia</footer>
    </div>
  )
}
