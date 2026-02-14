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
    
    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Awad Hitawi Barber",
      "image": "https://barber-registry.vercel.app/awad.jpeg",
      "description": "Professional barber services in Jordan. Book your haircut appointment online with Awad Hitawi, master barber.",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "JO"
      },
      "telephone": "+962787806337",
      "email": "awadhetawy@gmail.com",
      "priceRange": "$$",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "12:00",
          "closes": "21:00"
        }
      ],
      "url": "https://barber-registry.vercel.app/",
      "sameAs": [
        "https://www.instagram.com/hatawi_jo"
      ]
    }
    
    // Remove existing structured data script if any
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }
    
    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)
    
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
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
