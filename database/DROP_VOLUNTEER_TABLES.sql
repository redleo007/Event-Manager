-- Migration: Drop Volunteer-Related Tables
-- Date: January 20, 2026
-- Purpose: Remove all volunteer management features from the database
-- This migration safely drops volunteer, volunteer_attendance, and volunteer_work tables
-- and removes their associated constraints, indexes, and policies.

-- First, drop any policies on volunteer tables
DROP POLICY IF EXISTS "Allow all authenticated users" ON volunteer_work;
DROP POLICY IF EXISTS "Allow all authenticated users" ON volunteer_attendance;
DROP POLICY IF EXISTS "Allow all authenticated users" ON volunteers;

-- Drop dependent tables first (volunteer_attendance and volunteer_work depend on volunteers)
DROP TABLE IF EXISTS volunteer_work CASCADE;
DROP TABLE IF EXISTS volunteer_attendance CASCADE;

-- Drop the volunteers table and all its indexes and constraints
DROP TABLE IF EXISTS volunteers CASCADE;

-- Verify cleanup: these indexes should no longer exist, but removing explicitly just in case
DROP INDEX IF EXISTS idx_volunteer_work_volunteer;
DROP INDEX IF EXISTS idx_volunteer_work_event;
DROP INDEX IF EXISTS idx_volunteer_work_status;
DROP INDEX IF EXISTS idx_volunteer_work_created;
DROP INDEX IF EXISTS idx_volunteer_attendance_unique;
DROP INDEX IF EXISTS idx_volunteer_attendance_volunteer;
DROP INDEX IF EXISTS idx_volunteer_attendance_event;
DROP INDEX IF EXISTS idx_volunteer_attendance_status;
DROP INDEX IF EXISTS idx_volunteer_attendance_created;
DROP INDEX IF EXISTS idx_volunteers_email;
DROP INDEX IF EXISTS idx_volunteers_joined_date;
DROP INDEX IF EXISTS idx_volunteers_is_active;

-- Migration complete
-- All volunteer-related database structures have been removed.
-- Participants, events, attendance, and blocklist tables remain untouched.
