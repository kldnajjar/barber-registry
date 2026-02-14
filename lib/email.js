import nodemailer from 'nodemailer'

/**
 * Create and return a nodemailer transporter configured with SMTP settings from environment variables.
 * Returns null if SMTP credentials are not configured.
 * 
 * @returns {Object|null} Nodemailer transporter or null if not configured
 */
export function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  // Return null if SMTP credentials are not configured
  if (!SMTP_USER || !SMTP_PASS) {
    return null
  }

  // Create transporter with SMTP configuration
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(SMTP_PORT || '587', 10),
    secure: false, // Use STARTTLS
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })

  return transporter
}

/**
 * Convert 24-hour time format (HH:mm) to 12-hour format with AM/PM.
 * 
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format with AM/PM (e.g., "2:30 PM")
 */
function formatTime12Hour(time24) {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12 // Convert 0 to 12 for midnight
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Send booking notification email to the barber.
 * Handles SMTP configuration errors gracefully by logging and not throwing.
 * 
 * @param {Object} booking - Booking details
 * @param {string} booking.name - Customer name
 * @param {string} booking.email - Customer email
 * @param {string} booking.date - Booking date (YYYY-MM-DD)
 * @param {string} booking.time - Booking time in 24-hour format (HH:mm)
 * @returns {Promise<void>}
 */
export async function sendBookingEmail(booking) {
  const transporter = getTransporter()

  // If SMTP is not configured, log warning and return
  if (!transporter) {
    console.warn('SMTP not configured. Booking saved but no email sent.')
    return
  }

  const { name, email, date, time } = booking
  const time12Hour = formatTime12Hour(time)
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER

  const mailOptions = {
    from: fromAddress,
    to: process.env.SMTP_USER, // Send to barber (SMTP_USER)
    replyTo: email, // Customer's email for replies
    subject: `New Booking: ${name} on ${date}`,
    text: `New booking received:

Customer Name: ${name}
Customer Email: ${email}
Date: ${date}
Time: ${time12Hour}

Reply to this email to contact the customer directly.`,
    html: `<h2>New Booking Received</h2>
<p><strong>Customer Name:</strong> ${name}</p>
<p><strong>Customer Email:</strong> ${email}</p>
<p><strong>Date:</strong> ${date}</p>
<p><strong>Time:</strong> ${time12Hour}</p>
<p><em>Reply to this email to contact the customer directly.</em></p>`
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Booking email sent for ${name} on ${date} at ${time}`)
  } catch (error) {
    // Log error but don't throw - booking is already saved
    console.error('Failed to send booking email:', error.message)
  }
}
