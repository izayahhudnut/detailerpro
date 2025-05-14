/*
  # Fix organizations RLS policy

  1. Changes
    - Update RLS policies for organizations table to allow public inserts during signup
    - Keep existing policies for authenticated users to manage their organizations

  2. Security
    - Allow public users to create organizations (needed for signup flow)
    - Maintain existing RLS for authenticated users to manage their own organizations
*/

-- First ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow organization creation during signup" ON organizations;
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Users can delete own organization" ON organizations;

-- Create new policies
CREATE POLICY "Allow organization creation during signup"
ON organizations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can read own organization"
ON organizations
FOR SELECT
TO authenticated
USING (id IN (
  SELECT users.organization_id
  FROM users
  WHERE users.id = auth.uid()
));

CREATE POLICY "Users can update own organization"
ON organizations
FOR UPDATE
TO authenticated
USING (id IN (
  SELECT users.organization_id
  FROM users
  WHERE users.id = auth.uid()
))
WITH CHECK (id IN (
  SELECT users.organization_id
  FROM users
  WHERE users.id = auth.uid()
));

CREATE POLICY "Users can delete own organization"
ON organizations
FOR DELETE
TO authenticated
USING (id IN (
  SELECT users.organization_id
  FROM users
  WHERE users.id = auth.uid()
));