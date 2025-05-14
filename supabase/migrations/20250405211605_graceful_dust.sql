/*
  # Fix foreign key relationship between maintenance_jobs and employees

  1. Changes
    - Clean up any invalid employee_id references
    - Add foreign key constraint safely
    - Add index for better query performance

  2. Notes
    - Handles existing invalid data before adding constraint
    - Uses DO block for transaction safety
*/

DO $$ 
DECLARE
  default_employee_id uuid;
BEGIN
  -- First, ensure we have at least one employee to use as default
  INSERT INTO employees (
    name,
    email,
    phone,
    specialization,
    hire_date,
    status
  ) 
  VALUES (
    'System Default',
    'system@example.com',
    '000-000-0000',
    'Default',
    CURRENT_DATE,
    'active'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO default_employee_id;

  -- If no employee was created, get an existing one
  IF default_employee_id IS NULL THEN
    SELECT id INTO default_employee_id
    FROM employees
    ORDER BY created_at
    LIMIT 1;
  END IF;

  -- Update any maintenance jobs with invalid employee_ids
  UPDATE maintenance_jobs
  SET employee_id = default_employee_id
  WHERE employee_id NOT IN (SELECT id FROM employees)
     OR employee_id IS NULL;

  -- Now it's safe to add the foreign key constraint
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_jobs_employee_id_fkey'
  ) THEN
    ALTER TABLE maintenance_jobs
    ADD CONSTRAINT maintenance_jobs_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES employees(id);
  END IF;

  -- Add index for better join performance
  CREATE INDEX IF NOT EXISTS maintenance_jobs_employee_id_idx
  ON maintenance_jobs(employee_id);
END $$;