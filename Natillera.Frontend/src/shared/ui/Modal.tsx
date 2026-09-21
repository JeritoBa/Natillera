import type { ReactNode } from 'react'
import { Icon } from '@/shared/ui/Icon'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={onClose}>
      <div
        className="rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl"
        style={{ background: '#fff', border: '1px solid #d6e8dc' }}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#0c1a12]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-[#4e7460] hover:bg-[#eef4f0] transition-colors">
            <Icon.X />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
