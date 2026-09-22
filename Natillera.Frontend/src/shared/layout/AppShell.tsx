import { useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Page } from '@/shared/model/types'
import { Icon } from '@/shared/ui/Icon'

interface SidebarProps {
  page: Page
  setPage: (page: Page) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { logout, session } = useAuth()
  const user = session?.user
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : ''
  const roleLabel = user?.role === 'Admin' ? 'Administrador' : 'Miembro'
  const nav = [
    { id: 'dashboard', label: 'Dashboard', Icon: Icon.Dashboard },
    { id: 'members', label: 'Miembros', Icon: Icon.Members },
    { id: 'loans', label: 'Préstamos', Icon: Icon.Loans },
    { id: 'activities', label: 'Actividades', Icon: Icon.Activities },
    { id: 'payments', label: 'Cuotas', Icon: Icon.Payments },
    { id: 'transactions', label: 'Transacciones', Icon: Icon.Transactions },
  ] as const

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-60 h-screen transition-transform duration-250 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#fff', borderRight: '1px solid #d6e8dc' }}
      >
        <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: '#d6e8dc' }}>
          <Icon.Logo />
          <div>
            <p className="text-[#0c1a12] font-bold text-[15px] leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Natillera
            </p>
            <p className="text-[10px] text-[#4e7460] font-mono uppercase tracking-widest mt-0.5">Familiar</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ id, label, Icon: NavIcon }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setSidebarOpen(false) }}
              className={`nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left ${page === id ? 'active' : ''}`}
            >
              <NavIcon />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: '#d6e8dc' }}>
          <div className="flex items-center gap-2.5 px-3 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{ background: '#0c5c38', fontFamily: 'Outfit, sans-serif' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0c1a12] truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{user ? `${user.firstName} ${user.lastName}` : ''}</p>
              <p className="text-[11px] text-[#4e7460]">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); setPage('auth') }}
            className="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
          >
            <Icon.Logout />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Salir</span>
          </button>
        </div>
      </aside>
    </>
  )
}

interface AppShellProps {
  page: Page
  setPage: (page: Page) => void
  children: ReactNode
}

export function AppShell({ page, setPage, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f7f5' }}>
      <Sidebar page={page} setPage={setPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center gap-3 px-4 py-3 border-b lg:hidden"
          style={{ borderColor: '#d6e8dc', background: '#fff' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-[#4e7460]">
            <Icon.Menu />
          </button>
          <span className="font-semibold text-[#0c1a12] text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Natillera Familiar
          </span>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
