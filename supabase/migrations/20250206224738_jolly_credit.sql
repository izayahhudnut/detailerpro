/*
  # Fix cascading deletes for aircraft and maintenance jobs

  1. Changes
    - Add ON DELETE CASCADE to aircraft foreign key constraint for clients
    - Add ON DELETE CASCADE to maintenance_jobs foreign key constraint for aircraft
    - This ensures proper cascading deletion of related records
*/

-- Drop existing foreign key constraints
ALTER TABLE maintenance_jobs 
  DROP CONSTRAINT IF EXISTS maintenance_jobs_aircraft_id_fkey;

-- Recreate constraint with CASCADE
ALTER TABLE maintenance_jobs
  ADD CONSTRAINT maintenance_jobs_aircraft_id_fkey 
  FOREIGN KEY (aircraft_id) 
  REFERENCES aircraft(id) 
  ON DELETE CASCADE;

-- Add trigger to clean up related records
CREATE OR REPLACE FUNCTION cleanup_maintenance_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete related maintenance todos
  DELETE FROM maintenance_todos WHERE job_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintenance_jobs_cleanup
  BEFORE DELETE ON maintenance_jobs
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_maintenance_records();