import { useState, useMemo, useEffect, useCallback } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useLocale } from '../context/LocaleContext'
import { useSchedule, buildTimeSlots } from '../context/ScheduleContext'
import { getOpenDates } from '../i18n/translations'
import { DayStep } from './DayStep'
import { TimeStep } from './TimeStep'
import { ConfirmStep } from './ConfirmStep'

const HAS_GOOGLE_CLIENT = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

/** Format "HH:mm" to "h:mm AM/PM" for display. */
function formatTimeLabel(value) {
  if (!value || typeof value !== 'string') return value
  const [h, m] = value.split(':').map(Number)
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  const period = h < 12 ? 'AM' : 'PM'
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`
}

export function BookingFlow({ onBookingComplete }) {
  const { locale, t } = useLocale()
  const { config, loading } = useSchedule()
  const [weekOffset, setWeekOffset] = useState(0)
  const openDates = useMemo(
    () => getOpenDates(locale, 2, config.openDays, weekOffset, config.vacationRanges || []),
    [locale, config.openDays, weekOffset, config.vacationRanges]
  )
  const allTimeSlots = useMemo(() => buildTimeSlots(config), [config.startTime, config.endTime, config.slotMinutes])
  const [user, setUser] = useState(null)
  const [credential, setCredential] = useState(null)
  const [step, setStep] = useState('auth')
  const [selectedDay, setSelectedDay] = useState(null) // { dayKey, dateShort, date, isoDate }
  const [availableSlotValues, setAvailableSlotValues] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [time, setTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const timeSlots = useMemo(() => {
    if (slotsLoading) return []
    return availableSlotValues.map((value) => ({ value, label: formatTimeLabel(value) }))
  }, [slotsLoading, availableSlotValues])

  const fetchSlots = useCallback(() => {
    if (!selectedDay?.isoDate) return
    setSlotsLoading(true)
    setAvailableSlotValues([])
    const date = selectedDay.isoDate
    fetch(`/api/slots?date=${encodeURIComponent(date)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { available: [] }))
      .then((data) => setAvailableSlotValues(Array.isArray(data.available) ? data.available : []))
      .catch(() => setAvailableSlotValues([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDay?.isoDate])

  useEffect(() => {
    if (step !== 'time' || !selectedDay?.isoDate) return
    fetchSlots()
  }, [step, selectedDay?.isoDate, fetchSlots])

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setUser({ name: data.name, email: data.email, picture: data.picture })
          setCredential(tokenResponse)
          setStep('day')
          setError(null)
        })
        .catch(() => setError(t('errorLoadProfile')))
    },
    onError: () => setError(t('errorSignInFailed')),
    scope: 'email profile',
  })

  const handleDaySelect = (dayKey, dateShort, date, isoDate) => {
    setSelectedDay({ dayKey, dateShort, date, isoDate })
    setTime(null)
    setStep('time')
  }

  const handleTimeSelect = (tVal) => {
    setTime(tVal)
    if (tVal) setStep('confirm')
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          date: selectedDay?.isoDate,
          day: selectedDay?.dayKey,
          time,
          accessToken: credential?.access_token,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || t('errorBookingFailed'))
      onBookingComplete()
    } catch (e) {
      setError(e.message || t('errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  const timeLabel = useMemo(() => timeSlots.find((s) => s.value === time)?.label ?? time, [timeSlots, time])

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-xl text-center text-[var(--text-muted)]">
          {t('loading')}…
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-lg mx-auto px-4 py-8 md:py-12 animate-fade-in-up">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-1">
          {t('bookYourCut')}
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          {t('bookSubline')}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in-up">
            {error}
          </div>
        )}

        {step === 'auth' && (
          <div key="auth" className="flex flex-col items-center gap-4 animate-fade-in-up">
            {!HAS_GOOGLE_CLIENT && (
              <p className="text-sm text-[var(--text-muted)] text-center">
                {t('addGoogleIdHint')}
              </p>
            )}
            <button
              type="button"
              onClick={login}
              disabled={!HAS_GOOGLE_CLIENT}
              className="flex items-center justify-center gap-3 w-full max-w-xs py-3 px-4 rounded-lg bg-[var(--surface)] text-[var(--text)] font-medium border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:border-[var(--border)] disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('continueWithGoogle')}
            </button>
          </div>
        )}

        {step === 'day' && (
          <div key="day" className="animate-fade-in-up">
          <DayStep
            openDates={openDates}
            selectedDayKey={selectedDay?.dayKey}
            selectedDate={selectedDay?.date}
            selectedIsoDate={selectedDay?.isoDate}
            onSelect={handleDaySelect}
            onBack={() => setStep('auth')}
            weekOffset={weekOffset}
            onPrevWeek={() => setWeekOffset((w) => Math.max(0, w - 14))}
            onNextWeek={() => setWeekOffset((w) => w + 14)}
          />
          </div>
        )}

        {step === 'time' && (
          <div key="time" className="animate-fade-in-up">
          <TimeStep
            slots={timeSlots}
            selected={time}
            onSelect={handleTimeSelect}
            onBack={() => setStep('day')}
            loading={slotsLoading}
            onRetry={fetchSlots}
          />
          </div>
        )}

        {step === 'confirm' && (
          <div key="confirm" className="animate-fade-in-up">
          <ConfirmStep
            user={user}
            dayLabel={selectedDay?.dateShort ?? selectedDay?.dayKey}
            timeLabel={timeLabel}
            onConfirm={handleConfirm}
            onBack={() => setStep('time')}
            submitting={submitting}
          />
          </div>
        )}
      </div>
    </section>
  )
}
