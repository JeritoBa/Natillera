import { createContext, useContext, type ReactNode } from 'react'
import { COPY, type Copy, type Lang } from './copy'

const LangContext = createContext<Lang>('es')

export const LangProvider = ({ lang, children }: { lang: Lang; children: ReactNode }) => (
  <LangContext.Provider value={lang}>{children}</LangContext.Provider>
)

export const useLang = () => useContext(LangContext)
export const useCopy = (): Copy => COPY[useLang()]
