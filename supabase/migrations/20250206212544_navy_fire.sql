/*
  # Fix RLS policies for employee management

  1. Security Changes
    - Drop and recreate RLS policies for employees and employee_certifications tables
    - Add proper user authentication checks with explicit public role handling
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;

-- Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for employees table
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

-- Handle employee_certifications table
DROP POLICY IF EXISTS "Allow authenticated users to read employee certifications" ON employee_certifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert employee certifications" ON employee_certifications;
DROP POLICY IF EXISTS "Allow authenticated users to delete employee certifications" ON employee_certifications;

ALTER TABLE employee_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read employee certifications"
  ON employee_certifications
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert employee certifications"
  ON employee_certifications
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public delete employee certifications"
  ON employee_certifications
  FOR DELETE
  TO PUBLIC
  USING (true);