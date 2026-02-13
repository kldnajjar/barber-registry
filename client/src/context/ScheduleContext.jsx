import { createContext, useContext, useState, useEffect } from 'react'

const defaultConfig = {
  openDays: [1, 2, 3, 4, 5, 6],
  startTime: '12:00',
  endTime: '21:00',
  slotMinutes: 30,
  vacationRanges: [],
}

const ScheduleContext = createContext(null)

export function ScheduleProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = () => {
    setLoading(true)
    return fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setConfig({
          openDays: Array.isArray(data.openDays) ? data.openDays : defaultConfig.openDays,
          startTime: data.startTime || defaultConfig.startTime,
          endTime: data.endTime || defaultConfig.endTime,
          slotMinutes: Math.max(5, Math.min(120, parseInt(data.slotMinutes, 10) || 30)),
          vacationRanges: Array.isArray(data.vacationRanges) ? data.vacationRanges : defaultConfig.vacationRanges,
        })
      })
      .catch(() => setConfig(defaultConfig))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refetch()
  }, [])

  return (
    <ScheduleContext.Provider value={{ config, loading, error, refetch }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext)
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider')
  return ctx
}

/** Build time slots from config. Returns [{ value: "HH:mm", label: "h:mm AM/PM" }] */
export function buildTimeSlots(config) {
  const [startH, startM] = (config.startTime || '12:00').split(':').map(Number)
  const [endH, endM] = (config.endTime || '21:00').split(':').map(Number)
  const interval = config.slotMinutes || 30
  const startMinutes = startH * 60 + (startM || 0)
  const endMinutes = endH * 60 + (endM || 0)
  const slots = []
  for (let m = startMinutes; m < endMinutes; m += interval) {
    const h = Math.floor(m / 60)
    const min = m % 60
    const value = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    const period = h < 12 ? 'AM' : 'PM'
    const label = `${hour12}:${String(min).padStart(2, '0')} ${period}`
    slots.push({ value, label })
  }
  return slots
}
