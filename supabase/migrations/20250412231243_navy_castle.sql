/*
  # Fix users table schema and policies

  1. Changes
    - Add missing RLS policies for user creation
    - Add policy for users to insert their own data
    - Ensure proper handling of organization_id during signup

  2. Security
    - Enable RLS on users table (already enabled)
    - Add policy for user creation during signup
*/

-- Add policy to allow new users to insert their own data during signup
CREATE POLICY "Users can insert own data during signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add policy to allow public to create users during signup
CREATE POLICY "Allow public user creation during signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Modify organization_id to be nullable to allow initial user creation
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;