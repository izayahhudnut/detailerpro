/*
  # Fix Employee Creation and Role Assignment

  1. Changes
    - Drop and recreate employee_roles table with correct constraints
    - Add proper indexes and foreign key relationships
    - Create admin role if it doesn't exist
    - Fix RLS policies
*/

-- First drop existing tables if they exist
DROP TABLE IF EXISTS employee_roles CASCADE;

-- Recreate employee_roles table
CREATE TABLE employee_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create admin role
INSERT INTO employee_roles (name, description, permissions)
VALUES (
  'admin',
  'Full system access',
  '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
);

-- Add auth_id to employees if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE employees 
    ADD COLUMN auth_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add role_id to employees if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE employees 
    ADD COLUMN role_id uuid REFERENCES employee_roles(id);
  END IF;
END $$;

-- Update RLS policies
ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read employee roles"
  ON employee_roles
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Update employees table RLS
DROP POLICY IF EXISTS "Public read employees" ON employees;
DROP POLICY IF EXISTS "Public insert employees" ON employees;
DROP POLICY IF EXISTS "Public update employees" ON employees;
DROP POLICY IF EXISTS "Public delete employees" ON employees;

CREATE POLICY "Public read employees"
  ON employees
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert employees"
  ON employees
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update employees"
  ON employees
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete employees"
  ON employees
  FOR DELETE
  TO PUBLIC
  USING (true);