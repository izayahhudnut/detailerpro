/*
  # Fix organizations RLS policies

  1. Changes
    - Update RLS policies for organizations table to allow public users to create organizations
    - Keep existing policy for reading organizations

  2. Security
    - Allow public users to create organizations during signup
    - Maintain existing read policy for authenticated users to only see their own organization
*/

-- Drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Public can create organizations" ON organizations;

-- Create new insert policy that allows public users to create organizations
CREATE POLICY "Public can create organizations" 
ON organizations 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Note: We keep the existing select policy:
-- "Users can read own organization" ON organizations FOR SELECT
-- This ensures users can only read their own organization data