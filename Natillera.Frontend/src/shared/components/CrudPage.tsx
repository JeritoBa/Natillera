import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { Modal } from '@/shared/ui/Modal'

export interface ColumnDefinition<T> {
  label: string
  render: (row: T) => ReactNode
  align?: 'right'
}

export interface CrudConfig<T> {
  title: string
  subtitle: string
  columns: ColumnDefinition<T>[]
  formFields: { name: string; label: string; type: string; options?: string[] }[]
  emptyItem: Omit<T, 'id'>
  summaryStats?: { label: string; value: string }[]
}

export function CrudPage<T extends { id: number }>({ data: initial, config }: { data: T[]; config: CrudConfig<T> }) {
  const [data, setData] = useState(initial)
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const openCreate = () => {
    setForm(Object.fromEntries(config.formFields.map(field => [field.name, String((config.emptyItem as Record<string, unknown>)[field.name] ?? '')])))
    setEditing(null)
    setModal('create')
  }

  const openEdit = (row: T) => {
    setForm(Object.fromEntries(config.formFields.map(field => [field.name, String((row as Record<string, unknown>)[field.name] ?? '')])))
    setEditing(row)
    setModal('edit')
  }

  const save = () => {
    if (modal === 'create') {
      const id = Math.max(0, ...data.map(row => row.id)) + 1
      setData(previous => [...previous, { id, ...form } as unknown as T])
    } else if (editing) {
      setData(previous => previous.map(row => row.id === editing.id ? { ...editing, ...form } as T : row))
    }
    setModal(null)
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="text-xl font-bold text-[#0c1a12] mb-0.5">{config.title}</h1><p className="text-[#4e7460] text-sm">{config.subtitle}</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap"><Icon.Plus /> Agregar</button>
      </div>

      {config.summaryStats && <div className="grid grid-cols-3 gap-3 mb-5">{config.summaryStats.map(stat => <div key={stat.label} className="stat-card rounded-xl p-4"><p className="text-[#4e7460] text-xs mb-1">{stat.label}</p><p className="text-lg font-bold text-[#0c1a12] mono">{stat.value}</p></div>)}</div>}

      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #d6e8dc' }}>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }}>
            {config.columns.map(column => <th key={column.label} className={`px-5 py-3 text-[#4e7460] text-xs font-medium ${column.align === 'right' ? 'text-right' : 'text-left'}`}>{column.label}</th>)}
            <th className="px-5 py-3 text-right text-[#4e7460] text-xs font-medium">Acciones</th>
          </tr></thead>
          <tbody>
            {data.map(row => <tr key={row.id} className="table-row">
              {config.columns.map((column, index) => <td key={index} className={`px-5 py-3.5 ${column.align === 'right' ? 'text-right' : ''}`}>{column.render(row)}</td>)}
              <td className="px-5 py-3.5 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(row)} className="btn-ghost p-1.5 rounded-md"><Icon.Edit /></button><button onClick={() => setDeleteId(row.id)} className="btn-danger p-1.5 rounded-md"><Icon.Trash /></button></div></td>
            </tr>)}
            {data.length === 0 && <tr><td colSpan={config.columns.length + 1} className="px-5 py-12 text-center text-[#4e7460] text-sm">Sin registros</td></tr>}
          </tbody>
        </table></div>
      </div>

      {modal && <Modal title={modal === 'create' ? 'Nuevo registro' : 'Editar registro'} onClose={() => setModal(null)}><div className="space-y-4">
        {config.formFields.map(field => <div key={field.name}><label className="block text-sm font-medium text-[#0c1a12] mb-1.5">{field.label}</label>{field.type === 'select' ? <select value={form[field.name] ?? ''} onChange={event => setForm(previous => ({ ...previous, [field.name]: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm">{(field.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}</select> : <input type={field.type} value={form[field.name] ?? ''} onChange={event => setForm(previous => ({ ...previous, [field.name]: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-sm" />}</div>)}
        <div className="flex gap-3 pt-1"><button onClick={() => setModal(null)} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={save} className="btn-primary flex-1 py-2.5 rounded-lg text-sm">Guardar</button></div>
      </div></Modal>}

      {deleteId !== null && <Modal title="Eliminar registro" onClose={() => setDeleteId(null)}><p className="text-[#4e7460] text-sm mb-5">Esta acción no se puede deshacer. ¿Continuar?</p><div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">Cancelar</button><button onClick={() => { setData(previous => previous.filter(row => row.id !== deleteId)); setDeleteId(null) }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#c0392b', fontFamily: 'Outfit, sans-serif' }}>Eliminar</button></div></Modal>}
    </div>
  )
}
