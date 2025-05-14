/*
  # Add organization support to maintenance jobs

  1. Changes
    - Create organizations table if it doesn't exist
    - Create users table if it doesn't exist
    - Add organization_id to maintenance_jobs
    - Update RLS policies
*/

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Add organization_id to maintenance_jobs
ALTER TABLE maintenance_jobs
ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Update RLS policies
DROP POLICY IF EXISTS "Public read maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public insert maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public update maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public delete maintenance jobs" ON maintenance_jobs;

CREATE POLICY "Users can read maintenance jobs"
  ON maintenance_jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert maintenance jobs"
  ON maintenance_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update maintenance jobs"
  ON maintenance_jobs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete maintenance jobs"
  ON maintenance_jobs
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on organizations and users
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for organizations and users
CREATE POLICY "Allow all operations" ON organizations FOR ALL TO public USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL TO public USING (true);