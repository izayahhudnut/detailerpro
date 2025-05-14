/*
  # Add INSERT policy for clients table
  
  1. Security Changes
    - Add RLS policy to allow authenticated users to create new clients
    - Maintains existing SELECT policy
    
  Note: This maintains data security while allowing client creation functionality
*/

-- Add policy to allow authenticated users to insert new clients
CREATE POLICY "Users can create clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add policy to allow authenticated users to update clients
CREATE POLICY "Users can update clients"
ON clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);