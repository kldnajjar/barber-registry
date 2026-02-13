import { useLocale } from '../context/LocaleContext'

export function TimeStep({ slots, selected, onSelect, onBack, loading, onRetry }) {
  const { t, isRtl } = useLocale()
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-4 flex items-center gap-1"
      >
        {isRtl ? '→' : '←'} {t('back')}
      </button>
      <label className="block text-sm font-medium text-[var(--text)] mb-2">
        {t('time')}
      </label>
      {loading ? (
        <p className="py-4 text-[var(--text-muted)] text-sm">{t('loading')}…</p>
      ) : (
        <select
          value={selected ?? ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label={t('time')}
        >
          <option value="">— {t('time')} —</option>
          {slots.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )}
      {!loading && slots.length === 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-[var(--text-muted)]">{t('noSlotsAvailable')}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              {t('slotsTryAgain')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
