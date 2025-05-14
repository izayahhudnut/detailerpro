/*
  # Fix organizations table RLS policies

  1. Changes
    - Drop existing RLS policies for organizations table
    - Add new policies that allow:
      - Public users to create organizations (for signup)
      - Authenticated users to create organizations (for signup)
      - Users to read their own organization
      - Users to update their own organization
      - Users to delete their own organization

  2. Security
    - Maintains RLS on organizations table
    - Ensures users can only access their own organization data
    - Allows both public and authenticated users to create organizations during signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;

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