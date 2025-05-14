/*
  # Fix maintenance jobs trigger

  1. Changes
    - Drop existing trigger before recreating
    - Drop existing policies before recreating
    - Ensure all objects are created only if they don't exist
*/

-- Drop existing trigger and policies
DROP TRIGGER IF EXISTS update_maintenance_jobs_updated_at ON maintenance_jobs;
DROP POLICY IF EXISTS "Public read maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public insert maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public update maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public delete maintenance jobs" ON maintenance_jobs;

-- Create maintenance jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS maintenance_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  status maintenance_job_status NOT NULL DEFAULT 'not-started',
  template_id uuid REFERENCES progress_templates(id) ON DELETE SET NULL,
  notification_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_vehicle_id ON maintenance_jobs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_employee_id ON maintenance_jobs(employee_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_start_time ON maintenance_jobs(start_time);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_status ON maintenance_jobs(status);

-- Enable RLS
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Public read maintenance jobs"
  ON maintenance_jobs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert maintenance jobs"
  ON maintenance_jobs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public update maintenance jobs"
  ON maintenance_jobs
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public delete maintenance jobs"
  ON maintenance_jobs
  FOR DELETE
  TO public
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_maintenance_jobs_updated_at
  BEFORE UPDATE ON maintenance_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();