/*
  # Convert Aircraft to Vehicles

  1. Changes
    - Drop aircraft-related tables
    - Create new vehicles table
    - Update maintenance_jobs to reference vehicles
    - Add proper constraints and policies

  2. Notes
    - Uses proper policy syntax
    - Maintains data integrity with proper cascading
*/

-- Drop old aircraft-related tables
DROP TABLE IF EXISTS aircraft_tracking CASCADE;
DROP TABLE IF EXISTS aircraft CASCADE;

-- Create vehicles table
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year text NOT NULL,
  registration text NOT NULL,
  vin text,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read vehicles" ON vehicles
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert vehicles" ON vehicles
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update vehicles" ON vehicles
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete vehicles" ON vehicles
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Update maintenance_jobs to reference vehicles
DO $$ 
BEGIN
  -- Drop the foreign key constraint first
  ALTER TABLE maintenance_jobs 
    DROP CONSTRAINT IF EXISTS maintenance_jobs_aircraft_id_fkey;

  -- Rename the column
  ALTER TABLE maintenance_jobs 
    RENAME COLUMN aircraft_id TO vehicle_id;

  -- Add the new foreign key constraint
  ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_vehicle_id_fkey 
    FOREIGN KEY (vehicle_id) 
    REFERENCES vehicles(id) 
    ON DELETE CASCADE;
END $$;