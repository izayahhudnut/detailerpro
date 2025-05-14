/*
  # Add cascade delete for employee references
  
  1. Changes
    - Modify maintenance_jobs foreign key constraint to cascade delete when employee is deleted
  
  2. Purpose
    - Allow deletion of employees even when they have associated maintenance jobs
    - Maintenance jobs will be automatically deleted when the associated employee is deleted
*/

DO $$ 
BEGIN
  -- Drop existing foreign key constraint
  ALTER TABLE maintenance_jobs 
    DROP CONSTRAINT IF EXISTS maintenance_jobs_employee_id_fkey;

  -- Recreate constraint with CASCADE
  ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_employee_id_fkey 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(id) 
    ON DELETE CASCADE;
END $$;