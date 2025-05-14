/*
  # Simplify Authentication System

  1. Changes
    - Drop and recreate trigger function
    - Update RLS policies
    - Ensure idempotent table creation
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- Create or update employees table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    CREATE TABLE employees (
      id uuid PRIMARY KEY REFERENCES auth.users(id),
      name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL DEFAULT '',
      specialization text NOT NULL DEFAULT 'general',
      hire_date date NOT NULL DEFAULT CURRENT_DATE,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz DEFAULT now()
    );
  END IF;
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

-- Create new trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO employees (
    id,
    name,
    email
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();