/**
 * Notification utility for booking confirmations
 * Supports Telegram Bot API (100% free) and WhatsApp via Twilio (paid)
 */

/**
 * Send notification for a new booking via Telegram or WhatsApp
 * @param {Object} booking - Booking details
 * @param {string} booking.name - Customer name
 * @param {string} booking.email - Customer email
 * @param {string} booking.date - Booking date (YYYY-MM-DD)
 * @param {string} booking.time - Booking time (HH:mm)
 * @returns {Promise<void>}
 */
export async function sendWhatsAppNotification(booking) {
  try {
    // Format the message
    const message = formatBookingMessage(booking)
    
    // Try Telegram first (100% free)
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatId = process.env.TELEGRAM_CHAT_ID
    
    if (telegramBotToken && telegramChatId) {
      await sendTelegramMessage(telegramBotToken, telegramChatId, message)
      return
    }
    
    // Fallback to WhatsApp via Twilio (paid)
    const whatsappNumber = process.env.WHATSAPP_NUMBER
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER
    
    if (whatsappNumber && twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
      await sendTwilioWhatsApp(twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber, whatsappNumber, message)
      return
    }
    
    // No notification service configured
    console.log('Notification skipped: No Telegram or WhatsApp credentials configured')
    
  } catch (error) {
    // Log error but don't throw - notifications are non-critical
    console.error('Notification error:', error.message)
  }
}

/**
 * Send message via Telegram Bot API (100% FREE)
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message text
 */
async function sendTelegramMessage(botToken, chatId, message) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Telegram API error: ${error.description || response.statusText}`)
  }
  
  console.log('Telegram notification sent successfully')
}

/**
 * Send message via Twilio WhatsApp API (PAID)
 * @param {string} accountSid - Twilio account SID
 * @param {string} authToken - Twilio auth token
 * @param {string} fromNumber - Twilio WhatsApp number
 * @param {string} toNumber - Recipient WhatsApp number
 * @param {string} message - Message text
 */
async function sendTwilioWhatsApp(accountSid, authToken, fromNumber, toNumber, message) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${toNumber}`,
        Body: message
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Twilio API error: ${error.message || response.statusText}`)
  }
  
  console.log('WhatsApp notification sent successfully via Twilio')
}

/**
 * Format booking details into a WhatsApp message
 * @param {Object} booking - Booking details
 * @returns {string} Formatted message
 */
function formatBookingMessage(booking) {
  const { name, email, date, time } = booking
  
  // Format date for display
  const dateObj = new Date(date + 'T00:00:00')
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Format time for display (convert 24h to 12h)
  const [hour, minute] = time.split(':').map(Number)
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  const period = hour < 12 ? 'AM' : 'PM'
  const timeFormatted = `${hour12}:${String(minute).padStart(2, '0')} ${period}`
  
  return `🔔 New Booking Alert

📅 Date: ${dateFormatted}
⏰ Time: ${timeFormatted}
👤 Name: ${name}
📧 Email: ${email}

Please confirm with the customer.`
}
