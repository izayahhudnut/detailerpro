/*
  # Fix RLS policies for client management

  1. Security Changes
    - Drop and recreate RLS policies for clients and aircraft tables
    - Add public access policies to allow operations without authentication
    - Ensure consistent policy application across related tables
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;

-- Ensure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for clients table
CREATE POLICY "Public read clients"
  ON clients
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert clients"
  ON clients
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update clients"
  ON clients
  FOR UPDATE
  TO PUBLIC
  USING (true);

-- Handle aircraft table
DROP POLICY IF EXISTS "Allow authenticated users to read aircraft" ON aircraft;
DROP POLICY IF EXISTS "Allow authenticated users to insert aircraft" ON aircraft;
DROP POLICY IF EXISTS "Allow authenticated users to update aircraft" ON aircraft;

ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read aircraft"
  ON aircraft
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert aircraft"
  ON aircraft
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update aircraft"
  ON aircraft
  FOR UPDATE
  TO PUBLIC
  USING (true);