/*
  # Fix maintenance jobs relationships

  1. Changes
    - Add employee relationship to maintenance_jobs table
    - Update foreign key constraints
    - Add proper indexes
*/

-- Drop existing foreign key if it exists
ALTER TABLE maintenance_jobs
DROP CONSTRAINT IF EXISTS maintenance_jobs_employee_id_fkey;

-- Add employee_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maintenance_jobs' 
    AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE maintenance_jobs 
    ADD COLUMN employee_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES employees(id)
ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_employee_id
ON maintenance_jobs(employee_id);

-- Update RLS policies
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON maintenance_jobs;
CREATE POLICY "Allow all operations"
  ON maintenance_jobs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);