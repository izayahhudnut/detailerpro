/*
  # Remove organization functionality
  
  1. Changes
    - Drop organizations table
    - Remove organization_id from all tables
    - Simplify RLS policies to allow public access
    - Keep basic user authentication
*/

-- Drop organization-related tables and columns
DROP TABLE IF EXISTS organizations CASCADE;

-- Remove organization_id from maintenance_jobs
ALTER TABLE maintenance_jobs
DROP COLUMN IF EXISTS organization_id;

-- Remove organization_id from users
ALTER TABLE users
DROP COLUMN IF EXISTS organization_id;

-- Update RLS policies for maintenance_jobs to allow public access
DROP POLICY IF EXISTS "Users can read maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Users can insert maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Users can update maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Users can delete maintenance jobs" ON maintenance_jobs;

CREATE POLICY "Allow all operations on maintenance jobs"
  ON maintenance_jobs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Update users table policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Public can create users" ON users;

CREATE POLICY "Allow all operations on users"
  ON users FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Update handle_new_user function to remove organization logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;