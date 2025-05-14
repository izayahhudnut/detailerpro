/*
  # Update employees table and policies

  1. Changes
    - Drop existing trigger and function
    - Update employees table if it exists
    - Ensure RLS policies are set correctly
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- Update employees table if it exists
DO $$ 
BEGIN
  -- Add any missing columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE employees ADD COLUMN certifications jsonb DEFAULT '[]';
  END IF;

  -- Update column defaults and constraints
  ALTER TABLE employees 
    ALTER COLUMN phone SET DEFAULT '',
    ALTER COLUMN specialization SET DEFAULT 'general',
    ALTER COLUMN hire_date SET DEFAULT CURRENT_DATE,
    ALTER COLUMN status SET DEFAULT 'active';

END $$;

-- Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations" ON employees;

-- Create new policy
CREATE POLICY "Allow all operations"
  ON employees FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);