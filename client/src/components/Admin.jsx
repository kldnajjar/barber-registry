import { useState, useEffect } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import { useLocale } from '../context/LocaleContext'

const STORAGE_VERIFIED = 'adminVerified'
const STORAGE_SECRET = 'adminSecret'

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOT_OPTIONS = [15, 30, 45, 60]
const DAY_PRESETS = [
  { labelKey: 'adminWeekdays', days: [1, 2, 3, 4, 5] },
  { labelKey: 'adminMonSat', days: [1, 2, 3, 4, 5, 6] },
  { labelKey: 'adminAllWeek', days: [0, 1, 2, 3, 4, 5, 6] },
]
const TIME_PRESETS = [
  { label: '9–12', start: '09:00', end: '12:00' },
  { label: '12–18', start: '12:00', end: '18:00' },
  { label: '18–21', start: '18:00', end: '21:00' },
  { label: '9–21', start: '09:00', end: '21:00' },
]

export function Admin() {
  const { config, loading, refetch } = useSchedule()
  const { t } = useLocale()
  const [isLoggedIn, setIsLoggedIn] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_VERIFIED) === '1')
  const [adminSecret, setAdminSecret] = useState(() => typeof window !== 'undefined' ? (sessionStorage.getItem(STORAGE_SECRET) || '') : '')
  const [openDays, setOpenDays] = useState([1, 2, 3, 4, 5, 6])
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('21:00')
  const [slotMinutes, setSlotMinutes] = useState(30)
  const [vacationRanges, setVacationRanges] = useState([])
  const [loginKey, setLoginKey] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [needsSecret, setNeedsSecret] = useState(false)

  useEffect(() => {
    if (!loading && config) {
      setOpenDays(config.openDays || [1, 2, 3, 4, 5, 6])
      setStartTime(config.startTime || '12:00')
      setEndTime(config.endTime || '21:00')
      setSlotMinutes(config.slotMinutes ?? 30)
      setVacationRanges(Array.isArray(config.vacationRanges) && config.vacationRanges.length > 0 ? config.vacationRanges : [])
    }
  }, [loading, config])

  const toggleDay = (day) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  const addVacationRange = () => {
    setVacationRanges((prev) => [...prev, { start: '', end: '' }])
  }
  const removeVacationRange = (index) => {
    setVacationRanges((prev) => prev.filter((_, i) => i !== index))
  }
  const updateVacationRange = (index, field, value) => {
    setVacationRanges((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const vac = vacationRanges
        .filter((r) => r.start && r.end && r.start.length >= 10 && r.end.length >= 10)
        .map((r) => ({ start: r.start.slice(0, 10), end: r.end.slice(0, 10) }))
        .filter((r) => r.start <= r.end)
      const body = { openDays, startTime, endTime, slotMinutes, vacationRanges: vac }
      if (adminSecret) body.adminSecret = adminSecret
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 403) {
          setNeedsSecret(true)
          setMessage(t('adminInvalidKey'))
        } else {
          setMessage(data.message || t('adminSaveError'))
        }
        return
      }
      setNeedsSecret(false)
      setMessage(t('adminSaved'))
      refetch()
    } catch {
      setMessage(t('adminSaveError'))
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    window.location.href = '/'
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const url = `/api/admin/verify?adminSecret=${encodeURIComponent(loginKey)}`
      const res = await fetch(url)
      if (!res.ok) {
        setLoginError(t('adminLoginError'))
        return
      }
      sessionStorage.setItem(STORAGE_VERIFIED, '1')
      sessionStorage.setItem(STORAGE_SECRET, loginKey)
      setAdminSecret(loginKey)
      setIsLoggedIn(true)
    } catch {
      setLoginError(t('adminLoginError'))
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_VERIFIED)
    sessionStorage.removeItem(STORAGE_SECRET)
    setAdminSecret('')
    setLoginKey('')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <div className="max-w-sm mx-auto w-full px-4 py-16">
          <h1 className="font-display text-xl font-semibold text-[var(--text)] mb-1">
            {t('adminLoginTitle')}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            {t('adminLoginPrompt')}
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={loginKey}
              onChange={(e) => setLoginKey(e.target.value)}
              placeholder={t('adminKeyPlaceholder')}
              className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              autoComplete="current-password"
              autoFocus
            />
            {loginError && (
              <p className="text-sm text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
            >
              {loginLoading ? t('sending') : t('adminLoginButton')}
            </button>
          </form>
          <button
            type="button"
            onClick={goBack}
            className="mt-6 w-full py-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
          >
            ← {t('adminBack')}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">
        {t('loading')}…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <div className="max-w-md mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-semibold text-[var(--text)]">
            {t('adminTitle')}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
            >
              {t('adminLogout')}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm font-medium"
            >
              ← {t('adminBack')}
            </button>
          </div>
        </div>

        <p className="text-[var(--text-muted)] text-sm mb-6">
          {t('adminDescription')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">{t('adminPresetDays')}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {DAY_PRESETS.map(({ labelKey, days }) => (
                <button
                  key={labelKey}
                  type="button"
                  onClick={() => setOpenDays(days)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('adminOpenDays')}
            </label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <label
                  key={day}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    openDays.includes(day)
                      ? 'bg-[var(--accent-bg)] border-[var(--accent)] text-[var(--text)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={openDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{DAY_LABELS_EN[day]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">{t('adminPresetTimes')}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {TIME_PRESETS.map(({ label, start, end }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setStartTime(start)
                    setEndTime(end)
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                {t('adminStartTime')}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                {t('adminEndTime')}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          </div>

          <div className="rounded-lg bg-[var(--accent-bg)] border border-[var(--accent)] p-3">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-0.5">{t('adminSummary')}</p>
            <p className="text-sm font-medium text-[var(--text)]">
              {openDays.length ? openDays.map((d) => DAY_LABELS_EN[d]).join(', ') : '—'} · {startTime}–{endTime} · {slotMinutes} {t('adminMinutes')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              {t('adminSlotDuration')}
            </label>
            <select
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {SLOT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} {t('adminMinutes')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text)] mb-1">{t('adminVacationTitle')}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">{t('adminVacationHint')}</p>
            {vacationRanges.map((range, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 mb-2">
                <input
                  type="date"
                  value={range.start}
                  onChange={(e) => updateVacationRange(index, 'start', e.target.value)}
                  className="py-2 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  aria-label={t('adminVacationStart')}
                />
                <span className="text-[var(--text-muted)] text-sm">–</span>
                <input
                  type="date"
                  value={range.end}
                  onChange={(e) => updateVacationRange(index, 'end', e.target.value)}
                  className="py-2 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  aria-label={t('adminVacationEnd')}
                />
                <button
                  type="button"
                  onClick={() => removeVacationRange(index)}
                  className="py-2 px-3 rounded-lg text-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                >
                  {t('adminVacationRemove')}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVacationRange}
              className="mt-1 py-2 px-3 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors"
            >
              + {t('adminVacationAdd')}
            </button>
          </div>

          {needsSecret && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                {t('adminKey')}
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder={t('adminKeyPlaceholder')}
                className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                autoComplete="current-password"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t('adminKeyHint')}
              </p>
            </div>
          )}

          {message && (
            <p
              className={`text-sm ${
                message === t('adminSaved') ? 'text-[var(--gold)]' : 'text-red-400'
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || openDays.length === 0}
            className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {saving ? t('sending') : t('adminSave')}
          </button>
        </form>

        <button
          type="button"
          onClick={goBack}
          className="mt-6 w-full py-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
        >
          {t('adminBack')}
        </button>
      </div>
    </div>
  )
}
