import { Link } from 'react-router-dom'
import type { Page } from '@/shared/model/types'
import { useAuthForm } from '@/features/auth/hooks/useAuthForm'
import { BrandLogo } from '@/shared/ui/BrandLogo'
import { Icon } from '@/shared/ui/Icon'
import { WHATSAPP_URL } from '@/shared/lib/contact'

export function AuthPage({ setPage }: { setPage: (page: Page) => void }) {
  const authForm = useAuthForm(() => setPage('dashboard'))

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f7f5' }}>
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12" style={{ background: '#0c5c38', color: '#fff' }}>
        <div className="flex items-center gap-2.5">
          <Link to="/" aria-label="Gallego Nanclares, ir al inicio" className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><img src="/logo-gallego-nanclares-invertido.png" alt="" className="h-10 w-auto" /></Link>
        </div>
        <div>
          <p className="text-3xl font-bold leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Familia que ahorra junta, prospera junta.
          </p>
        </div>
        <p className="text-sm text-[#cfe8da]">Entras con el correo y la contraseña que te dio el administrador.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8"><Link to="/" aria-label="Gallego Nanclares, ir al inicio" className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c5c38]"><BrandLogo className="h-9 w-auto" /></Link></div>
          <h1 className="text-2xl font-bold text-[#0c1a12] mb-1">Bienvenido de vuelta</h1>
          <p className="text-[#4e7460] text-sm mb-8">Ingresa con tu correo y contraseña</p>

          <form onSubmit={authForm.submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Correo</label>
              <input type="email" value={authForm.email} onChange={event => authForm.setEmail(event.target.value)} placeholder="ana@familia.co" className="w-full px-3.5 py-2.5 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0c1a12] mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={authForm.showPassword ? 'text' : 'password'} value={authForm.password} onChange={event => authForm.setPassword(event.target.value)} placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-lg text-sm pr-10" required />
                <button type="button" onClick={() => authForm.setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4e7460] hover:text-[#0c1a12] transition-colors"><Icon.Eye open={authForm.showPassword} /></button>
              </div>
            </div>
            {authForm.sessionNotice && !authForm.error && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{authForm.sessionNotice}</p>}
            {authForm.error && <p role="alert" className="rounded-lg border border-[#f0c0bc] bg-[#fdf0ee] px-3 py-2.5 text-sm text-[#c0392b]">{authForm.error}</p>}
            <div className="flex items-center justify-end pt-1">
              <p className="text-xs text-[#4e7460]">¿Olvidaste tu contraseña? Pídele al administrador que te la restablezca.</p>
            </div>
            <button type="submit" disabled={authForm.loading} className="btn-primary w-full py-3 rounded-lg text-sm mt-1 flex items-center justify-center gap-2">
              {authForm.loading ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-[#4e7460] text-xs mt-6">¿Sin cuenta? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#0c5c38] hover:underline font-medium">Solicita acceso<span className="sr-only"> (abre WhatsApp en una pestaña nueva)</span> <span aria-hidden="true">↗</span></a></p>
        </div>
      </div>
    </div>
  )
}
