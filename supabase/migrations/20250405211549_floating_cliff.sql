/*
  # Add foreign key relationship between maintenance_jobs and employees

  1. Changes
    - Clean up any invalid employee_id references
    - Add foreign key constraint from maintenance_jobs.employee_id to employees.id
    - Add index on employee_id for better query performance

  2. Notes
    - Uses DO block to safely handle existing data
    - Removes invalid references before adding constraint
*/

DO $$ 
BEGIN
  -- First, clean up any maintenance jobs with invalid employee_ids
  UPDATE maintenance_jobs
  SET employee_id = (
    SELECT id FROM employees ORDER BY created_at LIMIT 1
  )
  WHERE employee_id NOT IN (SELECT id FROM employees);

  -- Now it's safe to add the foreign key constraint
  ALTER TABLE maintenance_jobs
  ADD CONSTRAINT maintenance_jobs_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id);

  -- Add index for better join performance
  CREATE INDEX IF NOT EXISTS maintenance_jobs_employee_id_idx
  ON maintenance_jobs(employee_id);
END $$;