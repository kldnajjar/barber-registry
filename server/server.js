import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load .env from the server folder so it works even when started from project root
dotenv.config({ path: path.join(__dirname, '.env') })
const SCHEDULE_FILE = path.join(__dirname, 'data', 'schedule.json')
const DB_PATH = path.join(__dirname, 'data', 'bookings.db')

mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date, time)
  )
`)

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

const BARBER_EMAIL = 'awadhetawy@gmail.com'
const BARBER_PHONE = '+962787806337'

const defaultSchedule = () => ({
  openDays: [1, 2, 3, 4, 5, 6],
  startTime: '12:00',
  endTime: '21:00',
  slotMinutes: 30,
  vacationRanges: [],
})

/** Check if date (YYYY-MM-DD) falls within any vacation range (inclusive). */
function isDateInVacation(dateStr, ranges) {
  if (!dateStr || !Array.isArray(ranges) || ranges.length === 0) return false
  for (const r of ranges) {
    const start = r && r.start ? String(r.start).trim().slice(0, 10) : ''
    const end = r && r.end ? String(r.end).trim().slice(0, 10) : ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && dateStr >= start && dateStr <= end) return true
  }
  return false
}

/** Parse schedule from env (fallback). Days: 0=Sun, 1=Mon, ... 6=Sat. Times in 24h "HH:mm". */
function scheduleFromEnv() {
  const openDaysRaw = process.env.OPEN_DAYS || '1,2,3,4,5,6'
  const openDays = openDaysRaw.split(',').map((d) => parseInt(d.trim(), 10)).filter((d) => d >= 0 && d <= 6)
  return {
    openDays: openDays.length ? openDays : [1, 2, 3, 4, 5, 6],
    startTime: process.env.START_TIME || '12:00',
    endTime: process.env.END_TIME || '21:00',
    slotMinutes: Math.max(5, Math.min(120, parseInt(process.env.SLOT_MINUTES || '30', 10))),
    vacationRanges: [],
  }
}

let cachedSchedule = null

/** Build list of slot time strings "HH:mm" from schedule config. */
function buildSlotTimes(schedule) {
  const [startH, startM] = (schedule.startTime || '12:00').split(':').map(Number)
  const [endH, endM] = (schedule.endTime || '21:00').split(':').map(Number)
  const interval = schedule.slotMinutes || 30
  const startMinutes = startH * 60 + (startM || 0)
  const endMinutes = endH * 60 + (endM || 0)
  const slots = []
  for (let m = startMinutes; m < endMinutes; m += interval) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return slots
}

/** Get schedule: file first, then env. */
async function getScheduleConfig() {
  if (cachedSchedule) return cachedSchedule
  try {
    const raw = await fs.readFile(SCHEDULE_FILE, 'utf8')
    const data = JSON.parse(raw)
    const openDays = Array.isArray(data.openDays) ? data.openDays.filter((d) => d >= 0 && d <= 6) : defaultSchedule().openDays
    const vac = Array.isArray(data.vacationRanges)
      ? data.vacationRanges.filter((r) => r && typeof r === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(r.start || '').trim().slice(0, 10)) && /^\d{4}-\d{2}-\d{2}$/.test(String(r.end || '').trim().slice(0, 10)))
      : []
    cachedSchedule = {
      openDays: openDays.length ? openDays : defaultSchedule().openDays,
      startTime: /^\d{1,2}:\d{2}$/.test(data.startTime) ? data.startTime : '12:00',
      endTime: /^\d{1,2}:\d{2}$/.test(data.endTime) ? data.endTime : '21:00',
      slotMinutes: Math.max(5, Math.min(120, parseInt(data.slotMinutes, 10) || 30)),
      vacationRanges: vac,
    }
    return cachedSchedule
  } catch {
    cachedSchedule = scheduleFromEnv()
    return cachedSchedule
  }
}

/** GET config: return schedule (used by frontend). */
app.get('/api/config', async (req, res) => {
  try {
    const config = await getScheduleConfig()
    res.json(config)
  } catch (err) {
    res.status(500).json(scheduleFromEnv())
  }
})

/** GET admin verify: check admin key (for barber login). If no ADMIN_SECRET set, accepts any. */
app.get('/api/admin/verify', (req, res) => {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return res.status(200).json({ ok: true })
  }
  const provided = req.query?.adminSecret ?? req.headers['x-admin-secret']
  if (provided !== secret) {
    return res.status(403).json({ message: 'Invalid or missing admin key.' })
  }
  res.status(200).json({ ok: true })
})

/** PUT config: save schedule (optional ADMIN_SECRET in body or header). */
app.put('/api/config', async (req, res) => {
  const secret = process.env.ADMIN_SECRET
  if (secret) {
    const provided = req.body?.adminSecret ?? req.headers['x-admin-secret']
    if (provided !== secret) {
      return res.status(403).json({ message: 'Invalid or missing admin key.' })
    }
  }
  const { openDays, startTime, endTime, slotMinutes, vacationRanges } = req.body || {}
  const openDaysArr = Array.isArray(openDays) ? openDays : (openDays && typeof openDays === 'string' ? openDays.split(',').map((d) => parseInt(d.trim(), 10)) : null)
  const days = openDaysArr && openDaysArr.length ? openDaysArr.filter((d) => d >= 0 && d <= 6) : defaultSchedule().openDays
  const start = /^\d{1,2}:\d{2}$/.test(startTime) ? startTime : '12:00'
  const end = /^\d{1,2}:\d{2}$/.test(endTime) ? endTime : '21:00'
  const slot = Math.max(5, Math.min(120, parseInt(slotMinutes, 10) || 30))
  const vac = Array.isArray(vacationRanges)
    ? vacationRanges
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          start: String(r.start || '').trim().slice(0, 10),
          end: String(r.end || '').trim().slice(0, 10),
        }))
        .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.start) && /^\d{4}-\d{2}-\d{2}$/.test(r.end) && r.start <= r.end)
    : []
  const payload = { openDays: days, startTime: start, endTime: end, slotMinutes: slot, vacationRanges: vac }
  try {
    await fs.mkdir(path.dirname(SCHEDULE_FILE), { recursive: true })
    await fs.writeFile(SCHEDULE_FILE, JSON.stringify(payload, null, 2), 'utf8')
    cachedSchedule = payload
    res.json(payload)
  } catch (err) {
    console.error('Write schedule error:', err)
    res.status(500).json({ message: 'Could not save schedule.' })
  }
})

/** GET slots: available time slots for a date (booked ones excluded). Query: date=YYYY-MM-DD */
app.get('/api/slots', async (req, res) => {
  const dateRaw = req.query.date
  const date = dateRaw && typeof dateRaw === 'string' ? dateRaw.trim().slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Missing or invalid date. Use date=YYYY-MM-DD' })
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  try {
    const schedule = await getScheduleConfig()
    if (isDateInVacation(date, schedule.vacationRanges)) {
      return res.json({ available: [] })
    }
    const allSlots = buildSlotTimes(schedule)
    const taken = db.prepare('SELECT time FROM bookings WHERE date = ?').all(date).map((r) => normalizeTime(r.time))
    const available = allSlots.filter((t) => !taken.includes(t))
    res.json({ available })
  } catch (err) {
    console.error('Slots error:', err)
    res.status(500).json({ message: 'Could not load slots.' })
  }
})

/** Normalize time to HH:mm for consistent comparison (handles "9:00" vs "09:00"). */
function normalizeTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return ''
  const parts = timeStr.trim().split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) || 0
  if (Number.isNaN(h)) return ''
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getTransporter() {
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
  const SMTP_USER = (process.env.SMTP_USER || '').trim().replace(/^['"]|['"]$/g, '')
  const SMTP_PASS = (process.env.SMTP_PASS || '').trim().replace(/^['"]|['"]$/g, '')
  if (!SMTP_USER || !SMTP_PASS) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

app.post('/api/booking', async (req, res) => {
  try {
    const { name, email, date, day, time } = req.body || {}
    if (!name || !email || !time) {
      return res.status(400).json({ message: 'Missing name, email, or time.' })
    }
    const dateStr = date && typeof date === 'string' ? date.trim().slice(0, 10) : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ message: 'Missing or invalid date. Use date as YYYY-MM-DD.' })
    }
    const schedule = await getScheduleConfig()
    const [sh, sm] = schedule.startTime.split(':').map(Number)
    const [eh, em] = schedule.endTime.split(':').map(Number)
    const [th, tm] = time.split(':').map(Number)
    const startMins = sh * 60 + (sm || 0)
    const endMins = eh * 60 + (em || 0)
    const slotMins = th * 60 + (tm || 0)
    if (slotMins < startMins || slotMins >= endMins) {
      return res.status(400).json({ message: 'Selected time is outside opening hours.' })
    }

    const timeNorm = normalizeTime(time)
    const existing = db.prepare('SELECT id FROM bookings WHERE date = ? AND time = ?').get(dateStr, timeNorm)
    if (existing) {
      return res.status(409).json({ message: 'This slot is no longer available. Please choose another date or time.' })
    }

    db.prepare('INSERT INTO bookings (date, time, name, email) VALUES (?, ?, ?, ?)').run(dateStr, timeNorm, name, email)

    const transporter = getTransporter()
    if (!transporter) {
      console.warn('No SMTP configured. Booking saved; email not sent. Set SMTP_USER and SMTP_PASS in server/.env.')
    } else {
      const timeLabel = timeNorm.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
        const hour = parseInt(h, 10)
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        return `${hour12}:${m} ${period}`
      })
      await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: BARBER_EMAIL,
      replyTo: email,
      subject: `[Barber Registry] New booking: ${name} — ${dateStr} at ${timeLabel}`,
      text: [
        `New booking request`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Date: ${dateStr}`,
        `Time: ${timeLabel}`,
        ``,
        `Reply to this email or call ${BARBER_PHONE} to confirm.`,
      ].join('\n'),
      html: [
        `<h2>New booking request</h2>`,
        `<p><strong>Name:</strong> ${name}</p>`,
        `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>`,
        `<p><strong>Date:</strong> ${dateStr}</p>`,
        `<p><strong>Time:</strong> ${timeLabel}</p>`,
        `<p>Reply to this email or call <a href="tel:${BARBER_PHONE}">${BARBER_PHONE}</a> to confirm.</p>`,
      ].join(''),
      }).catch((err) => {
        console.error('Booking email error (booking was saved):', err)
      })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Booking error:', err)
    res.status(500).json({ message: 'Failed to save booking. Try again.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  const hasEmail = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  console.log(`Barber registry API listening on http://localhost:${PORT}`)
  console.log(`Email: ${hasEmail ? 'configured' : 'NOT configured — set SMTP_USER and SMTP_PASS in server/.env then restart'}`)
})
