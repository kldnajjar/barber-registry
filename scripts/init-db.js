import { sql } from '@vercel/postgres';

/**
 * Database initialization script for Vercel Postgres
 * 
 * This script creates the necessary tables and indexes for the barber booking application.
 * It reads the POSTGRES_URL from environment variables and executes the schema creation.
 * 
 * Usage: node scripts/init-db.js
 * 
 * Requirements: 2.4, 3.4
 */

async function initializeDatabase() {
  console.log('Starting database initialization...');

  // Check for POSTGRES_URL
  if (!process.env.POSTGRES_URL) {
    console.error('ERROR: POSTGRES_URL environment variable is not set');
    console.error('Please set POSTGRES_URL before running this script');
    process.exit(1);
  }

  try {
    console.log('Connecting to Vercel Postgres...');

    // Create bookings table
    console.log('Creating bookings table...');
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
    `;
    console.log('✓ Bookings table created successfully');

    // Create index on bookings date
    console.log('Creating index on bookings(date)...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)
    `;
    console.log('✓ Index on bookings(date) created successfully');

    // Create schedule table
    console.log('Creating schedule table...');
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
    `;
    console.log('✓ Schedule table created successfully');

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nTables created:');
    console.log('  - bookings (with unique constraint on date, time)');
    console.log('  - schedule');
    console.log('\nIndexes created:');
    console.log('  - idx_bookings_date on bookings(date)');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.detail) {
      console.error('Details:', error.detail);
    }

    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
