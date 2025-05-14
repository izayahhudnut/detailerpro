/*
  # Fix cascading deletes

  1. Changes
    - Add ON DELETE CASCADE to aircraft foreign key constraint
    - Add ON DELETE CASCADE to maintenance_jobs foreign key constraint
*/

-- Drop existing foreign key constraints
ALTER TABLE aircraft 
  DROP CONSTRAINT IF EXISTS aircraft_client_id_fkey;

-- Recreate constraints with CASCADE
ALTER TABLE aircraft
  ADD CONSTRAINT aircraft_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;