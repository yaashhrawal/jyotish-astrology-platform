import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { translate } from '../i18n/terms'
import type { Lang } from '../i18n/terms'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (term: string) => string
}

const LanguageContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (s) => s,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem('jyotish_lang') || 'en') as Lang
  const [lang, setLangState] = useState<Lang>(stored)

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('jyotish_lang', l)
  }

  const t = (term: string) => translate(term, lang)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
