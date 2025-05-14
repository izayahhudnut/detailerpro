/*
  # Create Maintenance Schema

  1. New Tables
    - Create tables in correct order to handle foreign key relationships:
      a. Create clients table first
      b. Then vehicles table that references clients
      c. Then employees table
      d. Then progress_templates and progress_steps tables
      e. Finally maintenance_jobs table that references all above tables

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- First create clients table
CREATE TABLE IF NOT EXISTS clients (
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

CREATE POLICY "Public read clients"
  ON clients
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Then create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  registration text NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read vehicles"
  ON vehicles
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
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

CREATE POLICY "Public read employees"
  ON employees
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create progress templates table
CREATE TABLE IF NOT EXISTS progress_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read progress templates"
  ON progress_templates
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create progress steps table
CREATE TABLE IF NOT EXISTS progress_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES progress_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read progress steps"
  ON progress_steps
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create enum for maintenance job status
CREATE TYPE maintenance_job_status AS ENUM (
  'not-started',
  'in-progress',
  'qa',
  'done'
);

-- Finally create maintenance jobs table
CREATE TABLE IF NOT EXISTS maintenance_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  status maintenance_job_status NOT NULL DEFAULT 'not-started',
  template_id uuid REFERENCES progress_templates(id) ON DELETE SET NULL,
  notification_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read maintenance jobs"
  ON maintenance_jobs
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert maintenance jobs"
  ON maintenance_jobs
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update maintenance jobs"
  ON maintenance_jobs
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete maintenance jobs"
  ON maintenance_jobs
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_maintenance_jobs_updated_at
  BEFORE UPDATE
  ON maintenance_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_maintenance_jobs_vehicle_id ON maintenance_jobs(vehicle_id);
CREATE INDEX idx_maintenance_jobs_employee_id ON maintenance_jobs(employee_id);
CREATE INDEX idx_maintenance_jobs_start_time ON maintenance_jobs(start_time);
CREATE INDEX idx_maintenance_jobs_status ON maintenance_jobs(status);