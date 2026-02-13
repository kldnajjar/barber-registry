import { useLocale } from '../context/LocaleContext'

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path className="animate-check-draw" d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function BookingSuccess({ onBookAnother }) {
  const { t } = useLocale()
  return (
    <section className="max-w-lg mx-auto px-4 py-8 md:py-12 animate-fade-in-up">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 md:p-10 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-bg)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] animate-scale-in animate-ring-pulse">
          <CheckIcon className="w-9 h-9" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)] mt-6 animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}>
          {t('bookingSuccessTitle')}
        </h2>
        <p className="text-[var(--text-muted)] mt-3 max-w-sm mx-auto animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0, animationFillMode: 'forwards' }}>
          {t('bookingSuccessSubtitle')}
        </p>
        <p className="text-[var(--text)] font-medium mt-4 text-sm animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}>
          {t('confirmViaContactLabel')}{' '}
          <span dir="ltr" className="inline-block">{t('phoneNumber')}</span>
        </p>
        {onBookAnother && (
          <button
            type="button"
            onClick={onBookAnother}
            className="mt-8 py-2.5 px-5 rounded-lg border border-[var(--border)] text-[var(--text)] font-medium hover:bg-[var(--bg)] hover:border-[var(--accent)] hover:scale-[1.02] active:scale-[0.98] transition-colors transition-transform duration-200 animate-fade-in-up"
            style={{ animationDelay: '0.45s', opacity: 0, animationFillMode: 'forwards' }}
          >
            {t('bookAnother')}
          </button>
        )}
      </div>
    </section>
  )
}
