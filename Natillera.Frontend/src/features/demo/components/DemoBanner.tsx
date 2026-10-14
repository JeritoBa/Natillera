import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

const BUTTON = 'inline-flex min-h-10 items-center rounded-lg border border-[#0c5c38] px-3 text-sm font-medium text-[#0c5c38] hover:bg-[#dcf5e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c5c38]'

// DEMO-03: shown on every demo screen.
export function DemoBanner() {
  const { demoRole, enterDemo, exitDemo } = useAuth()
  const navigate = useNavigate()
  if (!demoRole) return null

  const otherRole = demoRole === 'Admin' ? 'Member' : 'Admin'
  const label = (role: 'Admin' | 'Member') => (role === 'Admin' ? 'Administrador' : 'Miembro')

  return (
    <div role="region" aria-label="Modo demo" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#d6e8dc] bg-[#eef4f0] px-4 py-2 text-sm text-[#0c5c38]">
      <p className="min-w-0 flex-1 basis-64">
        Estás en la demo: los datos son ficticios y no se guarda ningún cambio.{' '}
        <span className="font-semibold">Viendo como: {label(demoRole)}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={BUTTON} onClick={() => { enterDemo(otherRole); navigate('/dashboard') }}>Cambiar a {label(otherRole)}</button>
        <button type="button" className={BUTTON} onClick={() => { exitDemo(); navigate('/') }}>Salir de la demo</button>
      </div>
    </div>
  )
}
