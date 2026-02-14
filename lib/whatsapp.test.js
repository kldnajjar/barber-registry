import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendWhatsAppNotification } from './whatsapp.js'

describe('sendWhatsAppNotification', () => {
  let consoleLogSpy
  let consoleErrorSpy
  const originalEnv = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER
  }

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Clear all notification-related env vars
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    delete process.env.WHATSAPP_NUMBER
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_WHATSAPP_NUMBER
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    // Restore original env vars
    Object.assign(process.env, originalEnv)
  })

  it('should skip notification when no credentials are configured', async () => {
    await sendWhatsAppNotification({
      name: 'John Doe',
      email: 'john@example.com',
      date: '2024-03-15',
      time: '14:30'
    })

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Notification skipped: No Telegram or WhatsApp credentials configured'
    )
  })

  it('should send Telegram notification when configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token'
    process.env.TELEGRAM_CHAT_ID = '123456789'

    // Mock fetch for Telegram API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    })

    await sendWhatsAppNotification({
      name: 'Jane Smith',
      email: 'jane@example.com',
      date: '2024-03-20',
      time: '09:00'
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-bot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Jane Smith')
      })
    )
    expect(consoleLogSpy).toHaveBeenCalledWith('Telegram notification sent successfully')
  })

  it('should format message with correct booking details', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token'
    process.env.TELEGRAM_CHAT_ID = '123456789'

    let sentMessage = ''
    global.fetch = vi.fn().mockImplementation(async (url, options) => {
      const body = JSON.parse(options.body)
      sentMessage = body.text
      return { ok: true, json: async () => ({ ok: true }) }
    })

    await sendWhatsAppNotification({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      date: '2024-03-20',
      time: '15:30'
    })

    expect(sentMessage).toContain('New Booking Alert')
    expect(sentMessage).toContain('Bob Johnson')
    expect(sentMessage).toContain('bob@example.com')
    expect(sentMessage).toContain('3:30 PM')
  })

  it('should format time correctly for different hours', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token'
    process.env.TELEGRAM_CHAT_ID = '123456789'

    const testCases = [
      { time: '09:00', expected: '9:00 AM' },
      { time: '12:00', expected: '12:00 PM' },
      { time: '15:30', expected: '3:30 PM' },
      { time: '00:00', expected: '12:00 AM' }
    ]

    for (const { time, expected } of testCases) {
      let sentMessage = ''
      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        const body = JSON.parse(options.body)
        sentMessage = body.text
        return { ok: true, json: async () => ({ ok: true }) }
      })

      await sendWhatsAppNotification({
        name: 'Test User',
        email: 'test@example.com',
        date: '2024-03-20',
        time
      })

      expect(sentMessage).toContain(expected)
    }
  })

  it('should not throw error even if notification fails', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token'
    process.env.TELEGRAM_CHAT_ID = '123456789'

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    // This should not throw
    await expect(
      sendWhatsAppNotification({
        name: 'Test User',
        email: 'test@example.com',
        date: '2024-03-20',
        time: '10:00'
      })
    ).resolves.toBeUndefined()

    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

