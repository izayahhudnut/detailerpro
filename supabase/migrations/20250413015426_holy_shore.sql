-- Drop existing foreign key constraints
ALTER TABLE maintenance_jobs 
DROP CONSTRAINT IF EXISTS maintenance_jobs_employee_id_fkey;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_maintenance_jobs_employee_id;
DROP INDEX IF EXISTS idx_maintenance_jobs_employee_id_fk;

-- Add foreign key constraint with cascade delete
ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES employees(id)
ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_maintenance_jobs_employee_id 
ON maintenance_jobs(employee_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow all operations" ON maintenance_jobs;
CREATE POLICY "Allow all operations"
  ON maintenance_jobs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);