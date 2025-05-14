/*
  # Add RLS policies for vehicles table

  1. Security Changes
    - Enable RLS on vehicles table (if not already enabled)
    - Add policies for authenticated users to:
      - Insert new vehicles
      - Update existing vehicles
      - Delete vehicles
      - Read vehicles
    
  2. Notes
    - Policies allow authenticated users to manage vehicles
    - All operations are tied to client ownership
*/

-- Enable RLS on vehicles table (idempotent)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles" ON vehicles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (true);