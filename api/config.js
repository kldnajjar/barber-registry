import { sql } from '../lib/db.js'
import { getDefaultSchedule, validateSchedule } from '../lib/schedule-utils.js'

/**
 * Serverless function handler for schedule configuration
 * GET: Retrieve current schedule configuration
 * PUT: Update schedule configuration (admin only)
 */
export default async function handler(request, response) {
  // Handle GET request - retrieve schedule configuration
  if (request.method === 'GET') {
    try {
      // Query latest schedule from database
      const result = await sql`
        SELECT * FROM schedule 
        ORDER BY id DESC 
        LIMIT 1
      `
      
      // If no schedule exists, return default schedule
      if (result.rows.length === 0) {
        const defaultSchedule = getDefaultSchedule()
        return response.status(200).json(defaultSchedule)
      }
      
      // Extract schedule data from database row
      const row = result.rows[0]
      const schedule = {
        openDays: row.open_days,
        startTime: row.start_time,
        endTime: row.end_time,
        slotMinutes: row.slot_minutes,
        vacationRanges: row.vacation_ranges || []
      }
      
      return response.status(200).json(schedule)
      
    } catch (error) {
      console.error('Database error retrieving schedule:', error)
      return response.status(500).json({ 
        message: 'Database connection failed' 
      })
    }
  }
  
  // Handle PUT request - update schedule configuration (Task 5.2)
  if (request.method === 'PUT') {
    try {
      // Check admin authentication if ADMIN_SECRET is configured
      const adminSecret = process.env.ADMIN_SECRET
      if (adminSecret) {
        const providedSecret = request.body?.adminSecret || request.query?.adminSecret
        if (!providedSecret || providedSecret !== adminSecret) {
          return response.status(403).json({ 
            message: 'Invalid or missing admin key.' 
          })
        }
      }
      
      // Extract schedule data from request body
      const scheduleData = {
        openDays: request.body.openDays,
        startTime: request.body.startTime,
        endTime: request.body.endTime,
        slotMinutes: request.body.slotMinutes,
        vacationRanges: request.body.vacationRanges || []
      }
      
      // Validate schedule data
      const validation = validateSchedule(scheduleData)
      if (!validation.valid) {
        return response.status(400).json({ 
          message: 'Invalid schedule data',
          errors: validation.errors
        })
      }
      
      // Insert new schedule record into database
      const result = await sql`
        INSERT INTO schedule (open_days, start_time, end_time, slot_minutes, vacation_ranges)
        VALUES (
          ${scheduleData.openDays},
          ${scheduleData.startTime},
          ${scheduleData.endTime},
          ${scheduleData.slotMinutes},
          ${JSON.stringify(scheduleData.vacationRanges)}
        )
        RETURNING *
      `
      
      // Return updated schedule configuration
      const row = result.rows[0]
      const updatedSchedule = {
        openDays: row.open_days,
        startTime: row.start_time,
        endTime: row.end_time,
        slotMinutes: row.slot_minutes,
        vacationRanges: row.vacation_ranges || []
      }
      
      return response.status(200).json(updatedSchedule)
      
    } catch (error) {
      console.error('Database error updating schedule:', error)
      return response.status(500).json({ 
        message: 'Database connection failed' 
      })
    }
  }
  
  // Method not allowed
  return response.status(405).json({ 
    message: 'Method not allowed' 
  })
}
