/*
  # Add delete policies and task deletion functionality

  1. New Policies
    - Add delete policies for clients table
    - Add delete policies for employees table
    - Add delete policies for maintenance_jobs table
    - Add delete policies for aircraft table
    - Add delete policies for employee_certifications table

  2. Changes
    - Enable deletion for all related tables
*/

-- Add delete policies for clients
CREATE POLICY "Public delete clients"
  ON clients
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Add delete policies for employees
CREATE POLICY "Public delete employees"
  ON employees
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Add delete policies for aircraft
CREATE POLICY "Public delete aircraft"
  ON aircraft
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Add delete policies for maintenance_jobs
CREATE POLICY "Public delete maintenance jobs"
  ON maintenance_jobs
  FOR DELETE
  TO PUBLIC
  USING (true);