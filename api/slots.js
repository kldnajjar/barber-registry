import { sql } from '../lib/db.js'
import { getDefaultSchedule, buildSlotTimes, isDateInVacation } from '../lib/schedule-utils.js'

/**
 * Serverless function handler for available time slots
 * GET: Calculate and return available time slots for a given date
 */
export default async function handler(request, response) {
  // Only handle GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ 
      message: 'Method not allowed' 
    })
  }
  
  try {
    // Parse and validate date query parameter
    const { date } = request.query
    
    if (!date) {
      return response.status(400).json({ 
        message: 'Date parameter is required (format: YYYY-MM-DD)' 
      })
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return response.status(400).json({ 
        message: 'Invalid date format. Use YYYY-MM-DD' 
      })
    }
    
    // Retrieve schedule configuration from database
    const scheduleResult = await sql`
      SELECT * FROM schedule 
      ORDER BY id DESC 
      LIMIT 1
    `
    
    // Use default schedule if none exists
    let schedule
    if (scheduleResult.rows.length === 0) {
      schedule = getDefaultSchedule()
    } else {
      const row = scheduleResult.rows[0]
      schedule = {
        openDays: row.open_days,
        startTime: row.start_time,
        endTime: row.end_time,
        slotMinutes: row.slot_minutes,
        vacationRanges: row.vacation_ranges || []
      }
    }
    
    // Check if date is in vacation range
    if (isDateInVacation(date, schedule.vacationRanges)) {
      return response.status(200).json({ 
        available: [] 
      })
    }
    
    // Check if date is on a closed day
    const dateObj = new Date(date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    if (!schedule.openDays.includes(dayOfWeek)) {
      return response.status(200).json({ 
        available: [] 
      })
    }
    
    // Generate all time slots based on schedule
    const allSlots = buildSlotTimes(schedule)
    
    // Query booked slots from database for the date
    const bookingsResult = await sql`
      SELECT time FROM bookings 
      WHERE date = ${date}
    `
    
    // Extract booked times into a Set for efficient lookup
    const bookedTimes = new Set(
      bookingsResult.rows.map(row => row.time)
    )
    
    // Calculate available slots (all slots minus booked)
    let availableSlots = allSlots.filter(slot => !bookedTimes.has(slot))
    
    // Filter out past time slots if the date is today
    const today = new Date()
    const todayIso = today.toISOString().split('T')[0]
    
    if (date === todayIso) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinute
      
      availableSlots = availableSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number)
        const slotTimeInMinutes = slotHour * 60 + slotMinute
        return slotTimeInMinutes > currentTimeInMinutes
      })
    }
    
    return response.status(200).json({ 
      available: availableSlots 
    })
    
  } catch (error) {
    console.error('Error calculating available slots:', error)
    return response.status(500).json({ 
      message: 'Database connection failed' 
    })
  }
}
