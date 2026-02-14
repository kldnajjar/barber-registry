import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './config.js'

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
  validateSchedule: vi.fn()
}))

import { sql } from '../lib/db.js'
import { getDefaultSchedule } from '../lib/schedule-utils.js'

describe('GET /api/config', () => {
  let mockRequest
  let mockResponse
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock request
    mockRequest = {
      method: 'GET'
    }
    
    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })
  
  it('should return schedule from database when it exists', async () => {
    // Mock database response with schedule data
    sql.mockResolvedValue({
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
        slot_minutes: 60,
        vacation_ranges: [{ start: '2024-12-24', end: '2024-12-26' }],
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify database was queried
    expect(sql).toHaveBeenCalledOnce()
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 60,
      vacationRanges: [{ start: '2024-12-24', end: '2024-12-26' }]
    })
  })
  
  it('should return default schedule when database is empty', async () => {
    // Mock empty database response
    sql.mockResolvedValue({
      rows: []
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify database was queried
    expect(sql).toHaveBeenCalledOnce()
    
    // Verify getDefaultSchedule was called
    expect(getDefaultSchedule).toHaveBeenCalledOnce()
    
    // Verify response with default schedule
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5, 6],
      startTime: '12:00',
      endTime: '21:00',
      slotMinutes: 30,
      vacationRanges: []
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
  
  it('should handle schedule with null vacation_ranges', async () => {
    // Mock database response with null vacation_ranges
    sql.mockResolvedValue({
      rows: [{
        id: 1,
        open_days: [1, 2, 3, 4, 5, 6],
        start_time: '12:00',
        end_time: '21:00',
        slot_minutes: 30,
        vacation_ranges: null,
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify response with empty vacation ranges
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5, 6],
      startTime: '12:00',
      endTime: '21:00',
      slotMinutes: 30,
      vacationRanges: []
    })
  })
  
  it('should return 405 for unsupported methods', async () => {
    mockRequest.method = 'DELETE'
    
    await handler(mockRequest, mockResponse)
    
    expect(mockResponse.status).toHaveBeenCalledWith(405)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Method not allowed'
    })
  })
})

describe('PUT /api/config', () => {
  let mockRequest
  let mockResponse
  let originalEnv
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Save original environment
    originalEnv = process.env.ADMIN_SECRET
    
    // Create mock request
    mockRequest = {
      method: 'PUT',
      body: {
        openDays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
        slotMinutes: 60,
        vacationRanges: []
      }
    }
    
    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })
  
  afterEach(() => {
    // Restore original environment
    if (originalEnv === undefined) {
      delete process.env.ADMIN_SECRET
    } else {
      process.env.ADMIN_SECRET = originalEnv
    }
  })
  
  it('should update schedule when valid data provided and no admin secret configured', async () => {
    // Remove admin secret (development mode)
    delete process.env.ADMIN_SECRET
    
    // Mock validateSchedule to return valid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ valid: true, errors: [] })
    
    // Mock database insert
    sql.mockResolvedValue({
      rows: [{
        id: 2,
        open_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
        slot_minutes: 60,
        vacation_ranges: [],
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify validateSchedule was called
    expect(validateSchedule).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 60,
      vacationRanges: []
    })
    
    // Verify database insert was called
    expect(sql).toHaveBeenCalledOnce()
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 60,
      vacationRanges: []
    })
  })
  
  it('should reject request when admin secret is configured but not provided', async () => {
    // Set admin secret
    process.env.ADMIN_SECRET = 'test-secret'
    
    await handler(mockRequest, mockResponse)
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid or missing admin key.'
    })
    
    // Verify database was not called
    expect(sql).not.toHaveBeenCalled()
  })
  
  it('should reject request when admin secret is incorrect', async () => {
    // Set admin secret
    process.env.ADMIN_SECRET = 'test-secret'
    mockRequest.body.adminSecret = 'wrong-secret'
    
    await handler(mockRequest, mockResponse)
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid or missing admin key.'
    })
    
    // Verify database was not called
    expect(sql).not.toHaveBeenCalled()
  })
  
  it('should accept request when admin secret is correct in body', async () => {
    // Set admin secret
    process.env.ADMIN_SECRET = 'test-secret'
    mockRequest.body.adminSecret = 'test-secret'
    
    // Mock validateSchedule to return valid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ valid: true, errors: [] })
    
    // Mock database insert
    sql.mockResolvedValue({
      rows: [{
        id: 2,
        open_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
        slot_minutes: 60,
        vacation_ranges: [],
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(sql).toHaveBeenCalledOnce()
  })
  
  it('should accept request when admin secret is correct in query', async () => {
    // Set admin secret
    process.env.ADMIN_SECRET = 'test-secret'
    mockRequest.query = { adminSecret: 'test-secret' }
    
    // Mock validateSchedule to return valid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ valid: true, errors: [] })
    
    // Mock database insert
    sql.mockResolvedValue({
      rows: [{
        id: 2,
        open_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
        slot_minutes: 60,
        vacation_ranges: [],
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(sql).toHaveBeenCalledOnce()
  })
  
  it('should reject request when schedule validation fails', async () => {
    // Remove admin secret
    delete process.env.ADMIN_SECRET
    
    // Mock validateSchedule to return invalid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ 
      valid: false, 
      errors: ['openDays contains invalid day: 7 (must be 0-6)']
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid schedule data',
      errors: ['openDays contains invalid day: 7 (must be 0-6)']
    })
    
    // Verify database was not called
    expect(sql).not.toHaveBeenCalled()
  })
  
  it('should handle database errors with 500 response', async () => {
    // Remove admin secret
    delete process.env.ADMIN_SECRET
    
    // Mock validateSchedule to return valid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ valid: true, errors: [] })
    
    // Mock database error
    sql.mockRejectedValue(new Error('Connection failed'))
    
    await handler(mockRequest, mockResponse)
    
    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Database connection failed'
    })
  })
  
  it('should handle vacation ranges correctly', async () => {
    // Remove admin secret
    delete process.env.ADMIN_SECRET
    
    // Add vacation ranges to request
    mockRequest.body.vacationRanges = [
      { start: '2024-12-24', end: '2024-12-26' },
      { start: '2025-01-01', end: '2025-01-01' }
    ]
    
    // Mock validateSchedule to return valid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ valid: true, errors: [] })
    
    // Mock database insert
    sql.mockResolvedValue({
      rows: [{
        id: 2,
        open_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
        slot_minutes: 60,
        vacation_ranges: [
          { start: '2024-12-24', end: '2024-12-26' },
          { start: '2025-01-01', end: '2025-01-01' }
        ],
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify response includes vacation ranges
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      openDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 60,
      vacationRanges: [
        { start: '2024-12-24', end: '2024-12-26' },
        { start: '2025-01-01', end: '2025-01-01' }
      ]
    })
  })
  
  it('should default to empty vacation ranges if not provided', async () => {
    // Remove admin secret
    delete process.env.ADMIN_SECRET
    
    // Remove vacation ranges from request
    delete mockRequest.body.vacationRanges
    
    // Mock validateSchedule to return valid
    const { validateSchedule } = await import('../lib/schedule-utils.js')
    validateSchedule.mockReturnValue({ valid: true, errors: [] })
    
    // Mock database insert
    sql.mockResolvedValue({
      rows: [{
        id: 2,
        open_days: [1, 2, 3, 4, 5],
        start_time: '09:00',
        end_time: '18:00',
        slot_minutes: 60,
        vacation_ranges: [],
        updated_at: new Date()
      }]
    })
    
    await handler(mockRequest, mockResponse)
    
    // Verify validateSchedule was called with empty vacation ranges
    expect(validateSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        vacationRanges: []
      })
    )
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
  })
})
