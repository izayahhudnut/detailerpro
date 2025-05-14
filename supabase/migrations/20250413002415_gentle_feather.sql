/*
  # Fix maintenance jobs relationships

  1. Changes
    - Add foreign key relationships for maintenance_jobs table
    - Add proper indexes for better query performance
    - Update RLS policies
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE maintenance_jobs 
DROP CONSTRAINT IF EXISTS maintenance_jobs_vehicle_id_fkey,
DROP CONSTRAINT IF EXISTS maintenance_jobs_employee_id_fkey;

-- Add foreign key constraints
ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) 
REFERENCES vehicles(id) 
ON DELETE CASCADE;

ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_vehicle_id 
ON maintenance_jobs(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_employee_id 
ON maintenance_jobs(employee_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_start_time 
ON maintenance_jobs(start_time);

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_status 
ON maintenance_jobs(status);

-- Update RLS policies
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public insert maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public update maintenance jobs" ON maintenance_jobs;
DROP POLICY IF EXISTS "Public delete maintenance jobs" ON maintenance_jobs;

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