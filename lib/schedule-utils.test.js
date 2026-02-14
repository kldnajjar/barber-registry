import { describe, test, expect } from 'vitest'
import {
  buildSlotTimes,
  isDateInVacation,
  normalizeTime,
  validateSchedule,
  getDefaultSchedule
} from './schedule-utils.js'

describe('buildSlotTimes', () => {
  test('generates correct time slots for standard schedule', () => {
    const schedule = {
      startTime: '12:00',
      endTime: '14:00',
      slotMinutes: 30
    }
    const slots = buildSlotTimes(schedule)
    expect(slots).toEqual(['12:00', '12:30', '13:00', '13:30'])
  })

  test('generates slots with single-digit hours', () => {
    const schedule = {
      startTime: '9:00',
      endTime: '11:00',
      slotMinutes: 30
    }
    const slots = buildSlotTimes(schedule)
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30'])
  })

  test('handles 15-minute slots', () => {
    const schedule = {
      startTime: '10:00',
      endTime: '11:00',
      slotMinutes: 15
    }
    const slots = buildSlotTimes(schedule)
    expect(slots).toEqual(['10:00', '10:15', '10:30', '10:45'])
  })

  test('stops before end time', () => {
    const schedule = {
      startTime: '12:00',
      endTime: '12:30',
      slotMinutes: 30
    }
    const slots = buildSlotTimes(schedule)
    expect(slots).toEqual(['12:00'])
  })

  test('returns empty array when start equals end', () => {
    const schedule = {
      startTime: '12:00',
      endTime: '12:00',
      slotMinutes: 30
    }
    const slots = buildSlotTimes(schedule)
    expect(slots).toEqual([])
  })
})

describe('isDateInVacation', () => {
  test('returns false for empty vacation ranges', () => {
    expect(isDateInVacation('2024-01-15', [])).toBe(false)
  })

  test('returns false for null vacation ranges', () => {
    expect(isDateInVacation('2024-01-15', null)).toBe(false)
  })

  test('returns true when date is within vacation range', () => {
    const ranges = [{ start: '2024-01-10', end: '2024-01-20' }]
    expect(isDateInVacation('2024-01-15', ranges)).toBe(true)
  })

  test('returns true when date equals start date', () => {
    const ranges = [{ start: '2024-01-10', end: '2024-01-20' }]
    expect(isDateInVacation('2024-01-10', ranges)).toBe(true)
  })

  test('returns true when date equals end date', () => {
    const ranges = [{ start: '2024-01-10', end: '2024-01-20' }]
    expect(isDateInVacation('2024-01-20', ranges)).toBe(true)
  })

  test('returns false when date is before vacation range', () => {
    const ranges = [{ start: '2024-01-10', end: '2024-01-20' }]
    expect(isDateInVacation('2024-01-05', ranges)).toBe(false)
  })

  test('returns false when date is after vacation range', () => {
    const ranges = [{ start: '2024-01-10', end: '2024-01-20' }]
    expect(isDateInVacation('2024-01-25', ranges)).toBe(false)
  })

  test('checks multiple vacation ranges', () => {
    const ranges = [
      { start: '2024-01-10', end: '2024-01-15' },
      { start: '2024-02-01', end: '2024-02-05' }
    ]
    expect(isDateInVacation('2024-01-12', ranges)).toBe(true)
    expect(isDateInVacation('2024-02-03', ranges)).toBe(true)
    expect(isDateInVacation('2024-01-20', ranges)).toBe(false)
  })
})

describe('normalizeTime', () => {
  test('normalizes single-digit hour to HH:mm', () => {
    expect(normalizeTime('9:00')).toBe('09:00')
  })

  test('keeps double-digit hour as is', () => {
    expect(normalizeTime('12:00')).toBe('12:00')
  })

  test('normalizes single-digit minutes', () => {
    expect(normalizeTime('12:5')).toBe('12:05')
  })

  test('handles midnight', () => {
    expect(normalizeTime('0:00')).toBe('00:00')
  })

  test('handles various time formats', () => {
    expect(normalizeTime('9:30')).toBe('09:30')
    expect(normalizeTime('09:30')).toBe('09:30')
    expect(normalizeTime('15:45')).toBe('15:45')
  })
})

describe('validateSchedule', () => {
  test('validates correct schedule', () => {
    const schedule = {
      openDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 30,
      vacationRanges: []
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('rejects invalid openDays values', () => {
    const schedule = {
      openDays: [1, 2, 7, 8],
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 30,
      vacationRanges: []
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('openDays contains invalid day: 7 (must be 0-6)')
    expect(result.errors).toContain('openDays contains invalid day: 8 (must be 0-6)')
  })

  test('rejects non-array openDays', () => {
    const schedule = {
      openDays: 'not an array',
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 30,
      vacationRanges: []
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('openDays must be an array')
  })

  test('rejects invalid time format', () => {
    const schedule = {
      openDays: [1, 2, 3],
      startTime: '9am',
      endTime: '5pm',
      slotMinutes: 30,
      vacationRanges: []
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('startTime must be in HH:mm format')
    expect(result.errors).toContain('endTime must be in HH:mm format')
  })

  test('rejects invalid slotMinutes', () => {
    const schedule = {
      openDays: [1, 2, 3],
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 200,
      vacationRanges: []
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('slotMinutes must be an integer between 5 and 120')
  })

  test('validates date format but not date validity', () => {
    const schedule = {
      openDays: [1, 2, 3],
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 30,
      vacationRanges: [{ start: '2024-01-32', end: '2024-02-30' }]
    }
    const result = validateSchedule(schedule)
    // Note: This validates format (YYYY-MM-DD pattern), not actual date validity
    // Invalid dates like 01-32 still pass format validation
    expect(result.valid).toBe(true)
  })

  test('rejects vacation range where start is after end', () => {
    const schedule = {
      openDays: [1, 2, 3],
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 30,
      vacationRanges: [{ start: '2024-02-01', end: '2024-01-01' }]
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('start') && e.includes('after end'))).toBe(true)
  })

  test('accepts valid vacation ranges', () => {
    const schedule = {
      openDays: [1, 2, 3],
      startTime: '09:00',
      endTime: '17:00',
      slotMinutes: 30,
      vacationRanges: [
        { start: '2024-01-10', end: '2024-01-15' },
        { start: '2024-02-01', end: '2024-02-05' }
      ]
    }
    const result = validateSchedule(schedule)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
})

describe('getDefaultSchedule', () => {
  test('returns default schedule configuration', () => {
    const defaultSchedule = getDefaultSchedule()
    expect(defaultSchedule).toEqual({
      openDays: [1, 2, 3, 4, 5, 6],
      startTime: '12:00',
      endTime: '21:00',
      slotMinutes: 30,
      vacationRanges: []
    })
  })

  test('default schedule passes validation', () => {
    const defaultSchedule = getDefaultSchedule()
    const result = validateSchedule(defaultSchedule)
    expect(result.valid).toBe(true)
  })
})
