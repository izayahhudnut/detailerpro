/*
  # Fix maintenance jobs foreign key constraints

  1. Changes
    - Safely check for and add foreign key constraints
    - Add indexes for better performance
    
  2. Notes
    - Uses DO block to safely handle existing constraints
    - Adds indexes for foreign key columns
*/

DO $$ 
BEGIN
  -- First check and add vehicle_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_jobs_vehicle_id_fkey'
  ) THEN
    ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    ON DELETE CASCADE;
  END IF;

  -- Create index for vehicle_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_maintenance_jobs_vehicle_id'
  ) THEN
    CREATE INDEX idx_maintenance_jobs_vehicle_id 
    ON maintenance_jobs(vehicle_id);
  END IF;

  -- Create index for employee_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_maintenance_jobs_employee_id'
  ) THEN
    CREATE INDEX idx_maintenance_jobs_employee_id 
    ON maintenance_jobs(employee_id);
  END IF;
END $$;