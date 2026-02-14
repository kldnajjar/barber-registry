import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './slots.js'

// Mock the database module
vi.mock('../lib/db.js', () => ({
  sql: vi.fn()
}))

// Mock the schedule-utils module
vi.mock('../lib/schedule-utils.js', () => ({
  getDefaultSchedule: vi.fn(() => ({
    openDays: [1, 2, 3, 4, 5, 6],
    startTime: '12:00',
    endTime: '21:00',
    slotMinutes: 30,
    vacationRanges: []
  })),
  buildSlotTimes: vi.fn(() => ['12:00', '12:30', '13:00', '13:30', '14:00']),
  isDateInVacation: vi.fn(() => false)
}))

import { sql } from '../lib/db.js'
import { getDefaultSchedule, buildSlotTimes, isDateInVacation } from '../lib/schedule-utils.js'

describe('GET /api/slots', () => {
  let mockRequest
  let mockResponse
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock request
    mockRequest = {
      method: 'GET',
      query: {
        date: '2024-01-15'
      }
    }
    
    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })
  
  it('should return available slots when date is valid and open', async () => {
    // Mock database responses
    sql.mockResolvedValueOnce({
      // Schedule query
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: []
      }]
    }).mockResolvedValueOnce({
      // Bookings query
      rows: [
        { time: '12:30' },
        { time: '14:00' }
      ]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify buildSlotTimes was called
    expect(buildSlotTimes).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5, 6],
      startTime: '12:00',
      endTime: '21:00',
      slotMinutes: 30,
      vacationRanges: []
    })
    
    // Verify response with available slots (all slots minus booked)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      available: ['12:00', '13:00', '13:30']
    })
  })
  
  it('should return empty array when date is missing', async () => {
    mockRequest.query = {}
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Date parameter is required (format: YYYY-MM-DD)'
    })
  })
  
  it('should return error when date format is invalid', async () => {
    mockRequest.query.date = '2024/01/15'
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid date format. Use YYYY-MM-DD'
    })
  })
  
  it('should return empty array when date is in vacation', async () => {
    // Mock isDateInVacation to return true
    isDateInVacation.mockReturnValueOnce(true)
    
    // Mock schedule query
    sql.mockResolvedValueOnce({
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: [{ start: '2024-01-10', end: '2024-01-20' }]
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify isDateInVacation was called
    expect(isDateInVacation).toHaveBeenCalledWith('2024-01-15', [
      { start: '2024-01-10', end: '2024-01-20' }
    ])
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      available: []
    })
  })
  
  it('should return empty array when date is on a closed day', async () => {
    // Mock schedule query with only weekdays open (Monday-Friday = 1-5)
    sql.mockResolvedValueOnce({
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: []
      }]
    })
    
    // Use a Sunday date (2024-01-14 is a Sunday)
    mockRequest.query.date = '2024-01-14'
    
    await handler(mockRequest, mockResponse)
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      available: []
    })
  })
  
  it('should use default schedule when database is empty', async () => {
    // Mock empty schedule query
    sql.mockResolvedValueOnce({
      rows: []
    }).mockResolvedValueOnce({
      // Bookings query
      rows: []
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify getDefaultSchedule was called
    expect(getDefaultSchedule).toHaveBeenCalledOnce()
    
    // Verify buildSlotTimes was called with default schedule
    expect(buildSlotTimes).toHaveBeenCalled()
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
  })
  
  it('should return all slots when no bookings exist', async () => {
    // Mock database responses
    sql.mockResolvedValueOnce({
      // Schedule query
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: []
      }]
    }).mockResolvedValueOnce({
      // Empty bookings query
      rows: []
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify response with all slots available
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      available: ['12:00', '12:30', '13:00', '13:30', '14:00']
    })
  })
  
  it('should handle database errors with 500 response', async () => {
    // Mock database error
    sql.mockRejectedValue(new Error('Connection failed'))
    
    await handler(mockRequest, mockResponse)
    
    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Database connection failed'
    })
  })
  
  it('should return 405 for non-GET methods', async () => {
    mockRequest.method = 'POST'
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(405)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Method not allowed'
    })
  })
  
  it('should handle null vacation_ranges from database', async () => {
    // Mock database responses with null vacation_ranges
    sql.mockResolvedValueOnce({
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: null
      }]
    }).mockResolvedValueOnce({
      rows: []
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify isDateInVacation was called with empty array
    expect(isDateInVacation).toHaveBeenCalledWith('2024-01-15', [])
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
  })
})
