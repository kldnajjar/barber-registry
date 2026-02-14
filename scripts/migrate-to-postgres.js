#!/usr/bin/env node

/**
 * Migration script to transfer data from SQLite to Vercel Postgres
 * 
 * This script:
 * 1. Reads existing bookings from SQLite database
 * 2. Reads schedule configuration from schedule.json
 * 3. Creates tables in Postgres if they don't exist
 * 4. Inserts all bookings into Postgres (handles conflicts)
 * 5. Inserts schedule configuration into Postgres
 * 6. Reports migration statistics
 * 
 * Usage: node scripts/migrate-to-postgres.js
 * 
 * Prerequisites:
 * - POSTGRES_URL environment variable must be set
 * - SQLite database must exist at server/data/bookings.db
 * - schedule.json must exist at server/data/schedule.json
 */

import Database from 'better-sqlite3'
import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Statistics tracking
const stats = {
  bookings: {
    total: 0,
    success: 0,
    duplicates: 0,
    errors: 0
  },
  schedule: {
    success: false,
    error: null
  }
}

async function main() {
  console.log('Starting migration from SQLite to Vercel Postgres...\n')

  // Validate environment
  if (!process.env.POSTGRES_URL) {
    console.error('ERROR: POSTGRES_URL environment variable is not set')
    console.error('Please set POSTGRES_URL before running this script')
    process.exit(1)
  }

  try {
    // Step 1: Create tables in Postgres
    console.log('Step 1: Creating tables in Postgres...')
    await createTables()
    console.log('✓ Tables created successfully\n')

    // Step 2: Migrate bookings
    console.log('Step 2: Migrating bookings from SQLite...')
    await migrateBookings()
    console.log('✓ Bookings migration completed\n')

    // Step 3: Migrate schedule configuration
    console.log('Step 3: Migrating schedule configuration...')
    await migrateSchedule()
    console.log('✓ Schedule migration completed\n')

    // Step 4: Report statistics
    printStatistics()

  } catch (error) {
    console.error('\n❌ Migration failed with error:')
    console.error(error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

async function createTables() {
  // Create bookings table
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time VARCHAR(5) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, time)
    )
  `

  // Create index on bookings date
  await sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)
  `

  // Create schedule table
  await sql`
    CREATE TABLE IF NOT EXISTS schedule (
      id SERIAL PRIMARY KEY,
      open_days INTEGER[] NOT NULL,
      start_time VARCHAR(5) NOT NULL,
      end_time VARCHAR(5) NOT NULL,
      slot_minutes INTEGER NOT NULL,
      vacation_ranges JSONB DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

async function migrateBookings() {
  const dbPath = join(__dirname, '..', 'server', 'data', 'bookings.db')
  
  let db
  try {
    db = new Database(dbPath, { readonly: true })
  } catch (error) {
    console.error(`ERROR: Could not open SQLite database at ${dbPath}`)
    throw error
  }

  try {
    // Read all bookings from SQLite
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY id').all()
    stats.bookings.total = bookings.length

    console.log(`Found ${bookings.length} bookings to migrate`)

    // Insert each booking into Postgres
    for (const booking of bookings) {
      try {
        // Check if booking already exists
        const existing = await sql`
          SELECT id FROM bookings WHERE date = ${booking.date} AND time = ${booking.time}
        `
        
        if (existing.rows.length > 0) {
          stats.bookings.duplicates++
          console.log(`  ⚠ Duplicate: ${booking.date} ${booking.time} (${booking.name})`)
          continue
        }

        // Insert the booking
        await sql`
          INSERT INTO bookings (date, time, name, email, created_at)
          VALUES (
            ${booking.date},
            ${booking.time},
            ${booking.name},
            ${booking.email},
            ${booking.created_at || new Date().toISOString()}
          )
        `
        
        stats.bookings.success++
      } catch (error) {
        stats.bookings.errors++
        console.error(`  ❌ Error migrating booking: ${booking.date} ${booking.time}`)
        console.error(`     ${error.message}`)
      }
    }
  } finally {
    db.close()
  }
}

async function migrateSchedule() {
  const schedulePath = join(__dirname, '..', 'server', 'data', 'schedule.json')
  
  let scheduleData
  try {
    const scheduleJson = readFileSync(schedulePath, 'utf-8')
    scheduleData = JSON.parse(scheduleJson)
  } catch (error) {
    console.error(`ERROR: Could not read schedule.json at ${schedulePath}`)
    throw error
  }

  try {
    // Map JSON field names to database column names
    const openDays = scheduleData.openDays || []
    const startTime = scheduleData.startTime || '12:00'
    const endTime = scheduleData.endTime || '21:00'
    const slotMinutes = scheduleData.slotMinutes || 30
    const vacationRanges = JSON.stringify(scheduleData.vacationRanges || [])

    // Insert schedule configuration
    await sql`
      INSERT INTO schedule (open_days, start_time, end_time, slot_minutes, vacation_ranges)
      VALUES (
        ${openDays},
        ${startTime},
        ${endTime},
        ${slotMinutes},
        ${vacationRanges}::jsonb
      )
    `

    stats.schedule.success = true
    console.log(`  ✓ Migrated schedule: ${openDays.length} open days, ${startTime}-${endTime}, ${slotMinutes}min slots`)
  } catch (error) {
    stats.schedule.error = error.message
    console.error(`  ❌ Error migrating schedule: ${error.message}`)
    throw error
  }
}

function printStatistics() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('                 MIGRATION SUMMARY')
  console.log('═══════════════════════════════════════════════════════')
  console.log('\nBookings:')
  console.log(`  Total found:     ${stats.bookings.total}`)
  console.log(`  Successfully migrated: ${stats.bookings.success}`)
  console.log(`  Duplicates skipped:    ${stats.bookings.duplicates}`)
  console.log(`  Errors:          ${stats.bookings.errors}`)
  
  console.log('\nSchedule:')
  if (stats.schedule.success) {
    console.log('  ✓ Successfully migrated')
  } else {
    console.log(`  ❌ Failed: ${stats.schedule.error}`)
  }
  
  console.log('\n═══════════════════════════════════════════════════════')
  
  if (stats.bookings.errors > 0 || !stats.schedule.success) {
    console.log('\n⚠ Migration completed with errors. Please review the output above.')
    process.exit(1)
  } else {
    console.log('\n✓ Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Verify the migrated data in your Postgres database')
    console.log('2. Test your API endpoints with the new database')
    console.log('3. Deploy to Vercel when ready')
  }
}

// Run the migration
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
