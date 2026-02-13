import { useState, useEffect } from 'react'
import { useLocale } from './context/LocaleContext'
import { Hero } from './components/Hero'
import { BookingFlow } from './components/BookingFlow'
import { BookingSuccess } from './components/BookingSuccess'
import { Footer } from './components/Footer'
import { Admin } from './components/Admin'
import { LangSwitcher } from './components/LangSwitcher'

export default function App() {
  const [bookingComplete, setBookingComplete] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/admin')
  const { locale, t } = useLocale()

  useEffect(() => {
    document.title = t('siteTitle')
  }, [locale, t])

  useEffect(() => {
    const onPopState = () => setIsAdmin(window.location.pathname === '/admin')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (isAdmin) {
    return (
      <>
        <div className="fixed top-4 right-4 left-auto z-50 rtl:left-4 rtl:right-auto">
          <LangSwitcher />
        </div>
        <Admin />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-4 right-4 left-auto z-50 rtl:left-4 rtl:right-auto" aria-label="Language">
        <LangSwitcher />
      </div>
      <Hero />
      <main className="flex-1">
        {bookingComplete ? (
          <BookingSuccess onBookAnother={() => setBookingComplete(false)} />
        ) : (
          <BookingFlow onBookingComplete={() => setBookingComplete(true)} />
        )}
      </main>
      <Footer />
    </div>
  )
}
