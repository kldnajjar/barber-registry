-- Database initialization script for Vercel Postgres migration
-- This script creates the tables and indexes needed for the barber booking application

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, time)
);

-- Create index on bookings date for performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  open_days INTEGER[] NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  slot_minutes INTEGER NOT NULL,
  vacation_ranges JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
