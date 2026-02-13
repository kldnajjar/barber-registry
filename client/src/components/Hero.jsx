import { useLocale } from '../context/LocaleContext'

export function Hero() {
  const { t } = useLocale()

  return (
    <header className="bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-shrink-0">
            <img
              src="/awad.jpeg"
              alt={t('barberName')}
              className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover object-top shadow-md animate-hero-image"
            />
          </div>
          <div className="text-center md:text-start flex-1 min-w-0 w-full">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--text)] mb-1">
              {t('barberName')}
            </h1>
            <p className="text-[var(--accent)] font-medium text-lg">
              {t('masterBarber')}
            </p>
            <p className="text-[var(--text)] mt-3">
              {t('heroTagline')}
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-1 max-w-md">
              {t('heroSubline')}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
