import { sql } from '../lib/db.js'
import { getDefaultSchedule, normalizeTime, buildSlotTimes, isDateInVacation } from '../lib/schedule-utils.js'
import { sendBookingEmail } from '../lib/email.js'

/**
 * Serverless function handler for booking creation
 * POST: Create a new booking with validation and email notification
 */
export default async function handler(request, response) {
  // Only handle POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ 
      message: 'Method not allowed' 
    })
  }
  
  try {
    // Validate required fields (name, email, date, time)
    const { name, email, date, time } = request.body
    
    if (!name || !email || !date || !time) {
      return response.status(400).json({ 
        message: 'Missing required fields: name, email, date, and time are required' 
      })
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return response.status(400).json({ 
        message: 'Invalid date format. Use YYYY-MM-DD' 
      })
    }
    
    // Retrieve schedule configuration
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
      return response.status(400).json({ 
        message: 'Selected date is not available (vacation period)' 
      })
    }
    
    // Check if date is on a closed day
    const dateObj = new Date(date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay()
    
    if (!schedule.openDays.includes(dayOfWeek)) {
      return response.status(400).json({ 
        message: 'Selected date is not available (closed day)' 
      })
    }
    
    // Normalize time using normalizeTime()
    const normalizedTime = normalizeTime(time)
    
    // Validate time is within opening hours
    const allSlots = buildSlotTimes(schedule)
    if (!allSlots.includes(normalizedTime)) {
      return response.status(400).json({ 
        message: 'Selected time is outside opening hours' 
      })
    }
    
    // Check if slot is already booked (SELECT query)
    const existingBooking = await sql`
      SELECT id FROM bookings 
      WHERE date = ${date} AND time = ${normalizedTime}
    `
    
    if (existingBooking.rows.length > 0) {
      return response.status(409).json({ 
        message: 'This slot is no longer available. Please choose another date or time.' 
      })
    }
    
    // Insert booking into database
    try {
      await sql`
        INSERT INTO bookings (date, time, name, email)
        VALUES (${date}, ${normalizedTime}, ${name}, ${email})
      `
    } catch (insertError) {
      // Handle unique constraint violation (409 conflict)
      if (insertError.code === '23505') { // PostgreSQL unique violation code
        return response.status(409).json({ 
          message: 'This slot is no longer available. Please choose another date or time.' 
        })
      }
      throw insertError
    }
    
    // Send email notification using sendBookingEmail()
    // This doesn't throw errors - it logs them instead
    await sendBookingEmail({
      name,
      email,
      date,
      time: normalizedTime
    })
    
    // Return success response
    return response.status(200).json({ 
      ok: true 
    })
    
  } catch (error) {
    console.error('Error creating booking:', error)
    return response.status(500).json({ 
      message: 'Database connection failed' 
    })
  }
}
