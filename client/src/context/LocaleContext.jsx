import { createContext, useContext, useState, useEffect } from 'react'
import { translations, dayNames } from '../i18n/translations'

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    return localStorage.getItem('locale') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale === 'ar' ? 'ar' : 'en'
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const setLocale = (l) => setLocaleState(l === 'ar' ? 'ar' : 'en')
  const t = (key) => translations[locale]?.[key] ?? translations.en[key] ?? key
  const daysForLocale = dayNames[locale] || dayNames.en

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, daysForLocale, isRtl: locale === 'ar' }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
