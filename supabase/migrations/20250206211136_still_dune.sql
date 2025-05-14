/*
  # Initial Schema Setup

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `created_at` (timestamptz)

    - `aircraft`
      - `id` (uuid, primary key)
      - `registration` (text, unique)
      - `model` (text)
      - `client_id` (uuid, foreign key)
      - `created_at` (timestamptz)

    - `employees`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `specialization` (text)
      - `hire_date` (date)
      - `status` (text)
      - `created_at` (timestamptz)

    - `employee_certifications`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `certification` (text)
      - `created_at` (timestamptz)

    - `maintenance_jobs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `aircraft_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `start_time` (timestamptz)
      - `duration` (integer)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and write their own data
*/

-- Clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true);

-- Aircraft table
CREATE TABLE aircraft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration text UNIQUE NOT NULL,
  model text NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read aircraft"
  ON aircraft
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert aircraft"
  ON aircraft
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update aircraft"
  ON aircraft
  FOR UPDATE
  TO authenticated
  USING (true);

-- Employees table
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  specialization text NOT NULL,
  hire_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (true);

-- Employee certifications table
CREATE TABLE employee_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  certification text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read employee certifications"
  ON employee_certifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employee certifications"
  ON employee_certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employee certifications"
  ON employee_certifications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Maintenance jobs table
CREATE TABLE maintenance_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  aircraft_id uuid NOT NULL REFERENCES aircraft(id),
  employee_id uuid NOT NULL REFERENCES employees(id),
  start_time timestamptz NOT NULL,
  duration integer NOT NULL,
  status text NOT NULL CHECK (status IN ('not-started', 'in-progress', 'done')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read maintenance jobs"
  ON maintenance_jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert maintenance jobs"
  ON maintenance_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance jobs"
  ON maintenance_jobs
  FOR UPDATE
  TO authenticated
  USING (true);