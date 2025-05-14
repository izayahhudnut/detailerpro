-- Fix maintenance_jobs table relationships
ALTER TABLE maintenance_jobs
DROP CONSTRAINT IF EXISTS maintenance_jobs_employee_id_fkey;

ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES employees(id)
ON DELETE CASCADE;

-- Create job_inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES inventory(id),
  quantity_used integer NOT NULL,
  cost_at_time numeric NOT NULL DEFAULT 0,
  used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on job_inventory
ALTER TABLE job_inventory ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for job_inventory
CREATE POLICY "Allow all operations on job_inventory"
  ON job_inventory FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_inventory_job_id ON job_inventory(job_id);
CREATE INDEX IF NOT EXISTS idx_job_inventory_item_id ON job_inventory(item_id);