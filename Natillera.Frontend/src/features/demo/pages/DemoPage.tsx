import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { DemoRole } from '@/features/demo/model/demoSession'
import { BrandLogo } from '@/shared/ui/BrandLogo'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c5c38]'

// DEMO-01: public entry to the read-only demo.
export function DemoPage() {
  const { enterDemo } = useAuth()
  const navigate = useNavigate()

  const start = (role: DemoRole) => {
    enterDemo(role)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f7f5' }}>
      <header className="bg-white border-b border-[#d6e8dc]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between py-4 md:py-5">
          <Link to="/" aria-label="Ir a la página principal de Gallego Nanclares" className={`inline-flex rounded ${FOCUS}`}><BrandLogo className="h-8 sm:h-10 w-auto" /></Link>
          <Link to="/" className={`inline-flex min-h-11 items-center px-3 text-sm text-[#4e7460] hover:text-[#0c1a12] rounded ${FOCUS}`}>Volver al inicio</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#0c1a12]">Prueba la natillera</h1>
        <p className="mt-4 text-base md:text-lg leading-relaxed text-[#4e7460] max-w-[60ch]">
          Recorre el sistema con datos ficticios, sin crear cuenta. Elige cómo quieres verlo: como administrador, que registra todo, o como un miembro, que consulta sus saldos y movimientos.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <button type="button" onClick={() => start('Admin')} className={`btn-primary min-h-11 px-6 py-3 rounded-lg text-sm ${FOCUS}`}>Ver como administrador</button>
          <button type="button" onClick={() => start('Member')} className={`btn-ghost min-h-11 px-6 py-3 rounded-lg text-sm ${FOCUS}`}>Ver como miembro</button>
        </div>
        <p className="mt-6 text-sm text-[#4e7460]">Datos ficticios. Nada de lo que hagas aquí afecta la natillera real.</p>
      </main>
    </div>
  )
}
