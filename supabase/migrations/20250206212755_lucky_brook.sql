/*
  # Fix RLS policies for maintenance jobs

  1. Security Changes
    - Drop and recreate RLS policies for maintenance_jobs table
    - Add public access policies to allow operations without authentication
    - Ensure consistent policy application
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Allow authenticated users to insert maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Allow authenticated users to update maintenance jobs" ON maintenance_jobs;

-- Ensure RLS is enabled
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for maintenance_jobs table
CREATE POLICY "Public read maintenance jobs"
  ON maintenance_jobs
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert maintenance jobs"
  ON maintenance_jobs
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update maintenance jobs"
  ON maintenance_jobs
  FOR UPDATE
  TO PUBLIC
  USING (true);