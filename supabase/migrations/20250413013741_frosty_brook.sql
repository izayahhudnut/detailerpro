/*
  # Add foreign key constraints for maintenance jobs

  1. Changes
    - Add foreign key constraint between maintenance_jobs.employee_id and employees.id
    - Add foreign key constraint between maintenance_jobs.vehicle_id and vehicles.id

  2. Security
    - No changes to RLS policies
*/

-- Add foreign key constraint for employee_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_jobs_employee_id_fkey'
  ) THEN
    ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for vehicle_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_jobs_vehicle_id_fkey'
  ) THEN
    ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    ON DELETE CASCADE;
  END IF;
END $$;