/*
  # Fix maintenance jobs foreign key constraints

  1. Changes
    - Safely add foreign key constraints if they don't exist
    - Use DO block to handle existing constraints
    - Add proper error handling
*/

DO $$ 
BEGIN
  -- First check if the constraints don't exist before trying to add them
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_jobs_employee_id_fkey'
  ) THEN
    ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_jobs_vehicle_id_fkey'
  ) THEN
    ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vehicles_client_id_fkey'
  ) THEN
    ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE CASCADE;
  END IF;
END $$;