import { useLocale } from '../context/LocaleContext'
import { UserAvatar } from './UserAvatar'

export function ConfirmStep({ user, dayLabel, timeLabel, onConfirm, onBack, submitting }) {
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
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
          <UserAvatar name={user?.name} />
          <div>
            <p className="font-medium text-[var(--text)]">{user?.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('day')}</p>
            <p className="font-medium text-[var(--text)]">{dayLabel}</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('time')}</p>
            <p className="font-medium text-[var(--text)]">{timeLabel}</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {submitting ? t('sending') : t('confirmBookingRequest')}
      </button>
    </div>
  )
}
