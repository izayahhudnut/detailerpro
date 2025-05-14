/*
  # Fix clients table RLS policies

  1. Changes
    - Update INSERT policy for clients table to properly set organization_id
    - Ensure organization_id is set to the user's organization when creating clients

  2. Security
    - Maintains RLS enabled on clients table
    - Updates policy to ensure clients are created with correct organization_id
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create organization clients" ON clients;

-- Create new INSERT policy that properly sets organization_id
CREATE POLICY "Users can create organization clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure the organization_id matches the user's organization
  organization_id = get_user_organization()
);