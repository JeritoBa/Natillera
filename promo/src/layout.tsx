import { createContext, useContext, type ReactNode } from 'react'
import { LAYOUTS, type Format, type Layout } from './theme'

const LayoutContext = createContext<Layout>(LAYOUTS.vertical)

export const LayoutProvider = ({ format, children }: { format: Format; children: ReactNode }) => (
  <LayoutContext.Provider value={LAYOUTS[format]}>{children}</LayoutContext.Provider>
)

export const useLayout = () => useContext(LayoutContext)
