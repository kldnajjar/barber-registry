import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTransporter, sendBookingEmail } from './email.js'
import nodemailer from 'nodemailer'

// Mock nodemailer
vi.mock('nodemailer')

describe('getTransporter', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('returns null when SMTP_USER is not configured', () => {
    delete process.env.SMTP_USER
    process.env.SMTP_PASS = 'password'
    
    const transporter = getTransporter()
    expect(transporter).toBeNull()
  })

  test('returns null when SMTP_PASS is not configured', () => {
    process.env.SMTP_USER = 'user@example.com'
    delete process.env.SMTP_PASS
    
    const transporter = getTransporter()
    expect(transporter).toBeNull()
  })

  test('returns null when both SMTP_USER and SMTP_PASS are missing', () => {
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    
    const transporter = getTransporter()
    expect(transporter).toBeNull()
  })

  test('creates transporter with configured SMTP settings', () => {
    process.env.SMTP_USER = 'user@example.com'
    process.env.SMTP_PASS = 'password'
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '465'

    const mockTransporter = { sendMail: vi.fn() }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const transporter = getTransporter()

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    })
    expect(transporter).toBe(mockTransporter)
  })

  test('uses default SMTP_HOST when not provided', () => {
    process.env.SMTP_USER = 'user@example.com'
    process.env.SMTP_PASS = 'password'
    delete process.env.SMTP_HOST
    process.env.SMTP_PORT = '587'

    const mockTransporter = { sendMail: vi.fn() }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    getTransporter()

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    })
  })

  test('uses default SMTP_PORT when not provided', () => {
    process.env.SMTP_USER = 'user@example.com'
    process.env.SMTP_PASS = 'password'
    process.env.SMTP_HOST = 'smtp.example.com'
    delete process.env.SMTP_PORT

    const mockTransporter = { sendMail: vi.fn() }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    getTransporter()

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    })
  })
})

describe('sendBookingEmail', () => {
  const originalEnv = process.env
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('logs warning and returns when SMTP is not configured', async () => {
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS

    const booking = {
      name: 'John Doe',
      email: 'john@example.com',
      date: '2024-01-15',
      time: '14:00'
    }

    await sendBookingEmail(booking)

    expect(consoleWarnSpy).toHaveBeenCalledWith('SMTP not configured. Booking saved but no email sent.')
    expect(nodemailer.createTransport).not.toHaveBeenCalled()
  })

  test('sends email with correct details and 12-hour time format', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '587'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'John Doe',
      email: 'john@example.com',
      date: '2024-01-15',
      time: '14:30'
    }

    await sendBookingEmail(booking)

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'barber@example.com',
      to: 'barber@example.com',
      replyTo: 'john@example.com',
      subject: 'New Booking: John Doe on 2024-01-15',
      text: expect.stringContaining('2:30 PM'),
      html: expect.stringContaining('2:30 PM')
    })

    expect(consoleLogSpy).toHaveBeenCalledWith('Booking email sent for John Doe on 2024-01-15 at 14:30')
  })

  test('formats morning time correctly (AM)', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      date: '2024-01-16',
      time: '09:15'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.text).toContain('9:15 AM')
    expect(callArgs.html).toContain('9:15 AM')
  })

  test('formats noon correctly (12:00 PM)', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Test User',
      email: 'test@example.com',
      date: '2024-01-17',
      time: '12:00'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.text).toContain('12:00 PM')
    expect(callArgs.html).toContain('12:00 PM')
  })

  test('formats midnight correctly (12:00 AM)', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Night Owl',
      email: 'night@example.com',
      date: '2024-01-18',
      time: '00:00'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.text).toContain('12:00 AM')
    expect(callArgs.html).toContain('12:00 AM')
  })

  test('includes all booking details in email', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      date: '2024-02-20',
      time: '15:45'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    
    // Check text version
    expect(callArgs.text).toContain('Alice Johnson')
    expect(callArgs.text).toContain('alice@example.com')
    expect(callArgs.text).toContain('2024-02-20')
    expect(callArgs.text).toContain('3:45 PM')
    
    // Check HTML version
    expect(callArgs.html).toContain('Alice Johnson')
    expect(callArgs.html).toContain('alice@example.com')
    expect(callArgs.html).toContain('2024-02-20')
    expect(callArgs.html).toContain('3:45 PM')
  })

  test('sets reply-to as customer email', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Bob Wilson',
      email: 'bob@example.com',
      date: '2024-03-10',
      time: '16:00'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.replyTo).toBe('bob@example.com')
  })

  test('uses SMTP_FROM when configured', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'
    process.env.SMTP_FROM = 'noreply@barbershop.com'

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Test User',
      email: 'test@example.com',
      date: '2024-01-15',
      time: '14:00'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.from).toBe('noreply@barbershop.com')
  })

  test('defaults from address to SMTP_USER when SMTP_FROM not set', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'
    delete process.env.SMTP_FROM

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' })
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Test User',
      email: 'test@example.com',
      date: '2024-01-15',
      time: '14:00'
    }

    await sendBookingEmail(booking)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.from).toBe('barber@example.com')
  })

  test('handles email send failure gracefully', async () => {
    process.env.SMTP_USER = 'barber@example.com'
    process.env.SMTP_PASS = 'password'

    const mockError = new Error('SMTP connection failed')
    const mockSendMail = vi.fn().mockRejectedValue(mockError)
    const mockTransporter = { sendMail: mockSendMail }
    nodemailer.createTransport.mockReturnValue(mockTransporter)

    const booking = {
      name: 'Test User',
      email: 'test@example.com',
      date: '2024-01-15',
      time: '14:00'
    }

    // Should not throw
    await expect(sendBookingEmail(booking)).resolves.toBeUndefined()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send booking email:', 'SMTP connection failed')
  })
})
