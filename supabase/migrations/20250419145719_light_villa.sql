/*
  # Fix maintenance jobs employee relationship

  1. Changes
    - Drop and recreate the foreign key constraint for employee_id in maintenance_jobs table
    - Ensure proper relationship naming for the foreign key constraint

  2. Security
    - Maintain existing RLS policies
*/

DO $$ BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'maintenance_jobs_employee_id_fkey'
    AND table_name = 'maintenance_jobs'
  ) THEN
    ALTER TABLE maintenance_jobs DROP CONSTRAINT maintenance_jobs_employee_id_fkey;
  END IF;
END $$;

-- Recreate the foreign key constraint with proper naming
ALTER TABLE maintenance_jobs
ADD CONSTRAINT maintenance_jobs_employee_id_fkey
FOREIGN KEY (employee_id)
REFERENCES employees(id)
ON DELETE CASCADE;