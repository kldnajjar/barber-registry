import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from './booking.js'

// Mock dependencies
vi.mock('../lib/db.js', () => ({
  sql: vi.fn()
}))

vi.mock('../lib/email.js', () => ({
  sendBookingEmail: vi.fn()
}))

import { sql } from '../lib/db.js'
import { sendBookingEmail } from '../lib/email.js'

describe('POST /api/booking', () => {
  let mockRequest
  let mockResponse
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup mock request
    mockRequest = {
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        date: '2024-01-15',
        time: '14:00'
      }
    }
    
    // Setup mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
    
    // Default schedule mock
    sql.mockResolvedValueOnce({
      rows: [{
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: []
      }]
    })
  })
  
  it('should reject non-POST requests', async () => {
    mockRequest.method = 'GET'
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(405)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Method not allowed'
    })
  })
  
  it('should reject requests with missing required fields', async () => {
    mockRequest.body = { name: 'John Doe', email: 'john@example.com' }
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Missing required fields: name, email, date, and time are required'
    })
  })
  
  it('should reject invalid date format', async () => {
    mockRequest.body.date = '01/15/2024'
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid date format. Use YYYY-MM-DD'
    })
  })
  
  it('should reject bookings on vacation dates', async () => {
    sql.mockReset()
    sql.mockResolvedValueOnce({
      rows: [{
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: [{ start: '2024-01-10', end: '2024-01-20' }]
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Selected date is not available (vacation period)'
    })
  })
  
  it('should reject bookings on closed days', async () => {
    mockRequest.body.date = '2024-01-14' // Sunday
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Selected date is not available (closed day)'
    })
  })
  
  it('should reject bookings outside opening hours', async () => {
    mockRequest.body.time = '10:00' // Before opening time
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Selected time is outside opening hours'
    })
  })
  
  it('should reject bookings for already booked slots', async () => {
    // Mock existing booking check
    sql.mockResolvedValueOnce({
      rows: [{ id: 1 }] // Slot already booked
    })
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(409)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'This slot is no longer available. Please choose another date or time.'
    })
  })
  
  it('should handle unique constraint violation on insert', async () => {
    // Mock no existing booking
    sql.mockResolvedValueOnce({ rows: [] })
    
    // Mock insert with unique constraint violation
    const uniqueError = new Error('Unique constraint violation')
    uniqueError.code = '23505'
    sql.mockRejectedValueOnce(uniqueError)
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(409)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'This slot is no longer available. Please choose another date or time.'
    })
  })
  
  it('should create booking successfully and send email', async () => {
    // Mock no existing booking
    sql.mockResolvedValueOnce({ rows: [] })
    
    // Mock successful insert
    sql.mockResolvedValueOnce({ rows: [] })
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({ ok: true })
    expect(sendBookingEmail).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      date: '2024-01-15',
      time: '14:00'
    })
  })
  
  it('should normalize time format', async () => {
    mockRequest.body.time = '9:00' // Single digit hour
    
    // Mock no existing booking
    sql.mockResolvedValueOnce({ rows: [] })
    
    // Mock successful insert
    sql.mockResolvedValueOnce({ rows: [] })
    
    // Mock schedule with 9:00 slot
    sql.mockReset()
    sql.mockResolvedValueOnce({
      rows: [{
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '09:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: []
      }]
    })
    sql.mockResolvedValueOnce({ rows: [] })
    sql.mockResolvedValueOnce({ rows: [] })
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(sendBookingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        time: '09:00' // Normalized format
      })
    )
  })
  
  it('should use default schedule if none exists in database', async () => {
    sql.mockReset()
    // Mock empty schedule result
    sql.mockResolvedValueOnce({ rows: [] })
    // Mock no existing booking
    sql.mockResolvedValueOnce({ rows: [] })
    // Mock successful insert
    sql.mockResolvedValueOnce({ rows: [] })
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({ ok: true })
  })
  
  it('should handle database errors gracefully', async () => {
    sql.mockReset()
    sql.mockRejectedValueOnce(new Error('Database connection failed'))
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Database connection failed'
    })
  })
})
