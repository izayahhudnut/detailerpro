/*
  # Create employees table and update RLS policies

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `auth_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `specialization` (text)
      - `hire_date` (date)
      - `status` (employee_status)
      - `certifications` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on employees table
    - Add policies for authenticated users to read employee data
    - Add policy for service role to manage employees
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  specialization text DEFAULT 'general',
  hire_date date DEFAULT CURRENT_DATE,
  status employee_status DEFAULT 'active',
  certifications text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read employee data
CREATE POLICY "Authenticated users can read employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage employees
CREATE POLICY "Service role can manage employees"
  ON employees
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();