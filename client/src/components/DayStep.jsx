import { useLocale } from '../context/LocaleContext'

export function DayStep({ openDates, selectedDayKey, selectedDate, selectedIsoDate, onSelect, onBack, weekOffset, onPrevWeek, onNextWeek }) {
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
      {(onPrevWeek || onNextWeek) && (
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={onPrevWeek}
            disabled={weekOffset === 0}
            className="py-2 px-3 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent)]"
          >
            {isRtl ? '→' : '←'} {t('prevWeek')}
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="py-2 px-3 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]"
          >
            {t('nextWeek')} {isRtl ? '←' : '→'}
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {openDates.map(({ dayName, dayKey, date, dateShort, isoDate }) => (
          <button
            key={`${isoDate}-${dayKey}`}
            type="button"
            onClick={() => onSelect(dayKey, dateShort, date, isoDate)}
            className={`py-3 px-4 rounded-lg text-start font-medium transition-all border ${
              selectedDayKey === dayKey && (selectedDate === date || selectedIsoDate === isoDate)
                ? 'bg-[var(--accent-bg)] border-[var(--accent)] text-[var(--text)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-[var(--text-muted)]'
            }`}
          >
            <span className="block">{dayName}</span>
            <span className="block text-xs text-[var(--text-muted)] mt-0.5">{date}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
