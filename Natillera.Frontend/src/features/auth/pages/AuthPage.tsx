import type { Page } from '@/shared/model/types'
import { useAuthForm } from '@/features/auth/hooks/useAuthForm'
import { Icon } from '@/shared/ui/Icon'

export function AuthPage({ setPage }: { setPage: (page: Page) => void }) {
  const authForm = useAuthForm(() => setPage('dashboard'))

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f7f5' }}>
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12" style={{ background: '#0c5c38', color: '#fff' }}>
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="6" fill="rgba(255,255,255,0.15)"/>
            <path d="M9 21L15 9L21 21" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.5 17.5H18.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>Natillera</span>
        </div>
        <div>
          <p className="text-3xl font-bold leading-snug mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            "La mejor inversión es<br />la que haces con<br />tu familia."
          </p>
          <p className="text-sm opacity-60">Natillera Familiar · Colombia</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Fondo total', value: '$4.820.000' },
            { label: 'Rendimiento mensual', value: '2.4%' },
            { label: 'Miembros activos', value: '9' },
          ].map(stat => (
            <div key={stat.label} className="flex justify-between text-sm"><span className="opacity-60">{stat.label}</span><span className="font-semibold mono">{stat.value}</span></div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8"><Icon.Logo /><span className="font-bold text-[#0c1a12]" style={{ fontFamily: 'Outfit, sans-serif' }}>Natillera</span></div>
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
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-[#0c5c38]" /><span className="text-[#4e7460] text-sm">Recordarme</span></label>
              <button type="button" className="text-sm text-[#0c5c38] hover:underline">¿Olvidaste tu contraseña?</button>
            </div>
            <button type="submit" disabled={authForm.loading} className="btn-primary w-full py-3 rounded-lg text-sm mt-1 flex items-center justify-center gap-2">
              {authForm.loading ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-[#4e7460] text-xs mt-6">¿Sin cuenta? <button className="text-[#0c5c38] hover:underline font-medium">Solicita acceso</button></p>
        </div>
      </div>
    </div>
  )
}
