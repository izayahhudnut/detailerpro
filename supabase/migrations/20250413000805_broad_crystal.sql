/*
  # Add foreign key relationship between maintenance_jobs and employees

  1. Changes
    - Add foreign key constraint from maintenance_jobs.employee_id to employees.id
    - Add index on maintenance_jobs.employee_id for better query performance

  2. Security
    - No changes to RLS policies
*/

-- Add foreign key constraint
ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES employees(id)
ON DELETE RESTRICT;

-- Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_employee_id_fk
ON maintenance_jobs(employee_id);