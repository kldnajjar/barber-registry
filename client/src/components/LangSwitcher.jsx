import { useLocale } from '../context/LocaleContext'

export function LangSwitcher() {
  const { locale, setLocale } = useLocale()
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] p-1 shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          locale === 'en'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('ar')}
        aria-pressed={locale === 'ar'}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          locale === 'ar'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        عربي
      </button>
    </div>
  )
}
