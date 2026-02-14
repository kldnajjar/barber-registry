/**
 * Schedule utility functions for barber booking application
 * Handles time slot generation, vacation checking, time normalization, and validation
 */

/**
 * Generate array of time slots from schedule configuration
 * @param {Object} schedule - Schedule configuration with startTime, endTime, slotMinutes
 * @param {string} schedule.startTime - Opening time in HH:mm format
 * @param {string} schedule.endTime - Closing time in HH:mm format
 * @param {number} schedule.slotMinutes - Duration of each slot in minutes
 * @returns {string[]} Array of time slots in HH:mm format
 */
export function buildSlotTimes(schedule) {
  const { startTime, endTime, slotMinutes } = schedule
  const slots = []
  
  // Parse start time
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const startTotalMinutes = startHour * 60 + startMinute
  
  // Parse end time
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const endTotalMinutes = endHour * 60 + endMinute
  
  // Generate slots from start to end (exclusive of end time)
  for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += slotMinutes) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    slots.push(timeStr)
  }
  
  return slots
}

/**
 * Check if a date falls within any vacation range
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {Array<{start: string, end: string}>} vacationRanges - Array of vacation ranges
 * @returns {boolean} True if date is in vacation, false otherwise
 */
export function isDateInVacation(dateStr, vacationRanges) {
  if (!vacationRanges || vacationRanges.length === 0) {
    return false
  }
  
  for (const range of vacationRanges) {
    if (dateStr >= range.start && dateStr <= range.end) {
      return true
    }
  }
  
  return false
}

/**
 * Normalize time string to HH:mm format
 * @param {string} timeStr - Time string (e.g., "9:00" or "09:00")
 * @returns {string} Time in HH:mm format (e.g., "09:00")
 */
export function normalizeTime(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/**
 * Validate schedule configuration object
 * @param {Object} schedule - Schedule configuration to validate
 * @param {number[]} schedule.openDays - Array of day numbers (0-6)
 * @param {string} schedule.startTime - Opening time in HH:mm format
 * @param {string} schedule.endTime - Closing time in HH:mm format
 * @param {number} schedule.slotMinutes - Slot duration in minutes
 * @param {Array<{start: string, end: string}>} schedule.vacationRanges - Vacation ranges
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateSchedule(schedule) {
  const errors = []
  
  // Validate openDays
  if (!Array.isArray(schedule.openDays)) {
    errors.push('openDays must be an array')
  } else {
    for (const day of schedule.openDays) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        errors.push(`openDays contains invalid day: ${day} (must be 0-6)`)
      }
    }
  }
  
  // Validate time format (HH:mm)
  const timeRegex = /^\d{1,2}:\d{2}$/
  if (!schedule.startTime || !timeRegex.test(schedule.startTime)) {
    errors.push('startTime must be in HH:mm format')
  }
  if (!schedule.endTime || !timeRegex.test(schedule.endTime)) {
    errors.push('endTime must be in HH:mm format')
  }
  
  // Validate slotMinutes
  if (!Number.isInteger(schedule.slotMinutes) || schedule.slotMinutes < 5 || schedule.slotMinutes > 120) {
    errors.push('slotMinutes must be an integer between 5 and 120')
  }
  
  // Validate vacationRanges
  if (schedule.vacationRanges) {
    if (!Array.isArray(schedule.vacationRanges)) {
      errors.push('vacationRanges must be an array')
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      for (const range of schedule.vacationRanges) {
        if (!range.start || !dateRegex.test(range.start)) {
          errors.push('vacation range start must be in YYYY-MM-DD format')
        }
        if (!range.end || !dateRegex.test(range.end)) {
          errors.push('vacation range end must be in YYYY-MM-DD format')
        }
        if (range.start && range.end && range.start > range.end) {
          errors.push(`vacation range invalid: start ${range.start} is after end ${range.end}`)
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get default schedule configuration
 * @returns {Object} Default schedule configuration
 */
export function getDefaultSchedule() {
  return {
    openDays: [1, 2, 3, 4, 5, 6], // Monday through Saturday
    startTime: '12:00',
    endTime: '21:00',
    slotMinutes: 30,
    vacationRanges: []
  }
}
