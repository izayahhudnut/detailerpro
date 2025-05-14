/*
  # Fix admin role assignment

  1. Changes
    - Ensure admin role exists with correct permissions
    - Update handle_new_user function to assign admin role
    - Update existing users to have admin role
    - Add proper RLS policies
*/

-- First ensure admin role exists
INSERT INTO employee_roles (name, description, permissions)
VALUES (
  'admin',
  'Full system access',
  '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
)
ON CONFLICT (name) 
DO UPDATE SET permissions = '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
RETURNING id;

-- Update handle_new_user function to assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id 
  FROM employee_roles 
  WHERE name = 'admin';

  -- Create employee record with admin role
  INSERT INTO public.employees (
    auth_id,
    name,
    email,
    phone,
    specialization,
    hire_date,
    status,
    role_id  -- Add admin role here
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NEW.email,
    'Not set',
    'Administrator',
    CURRENT_DATE,
    'active',
    admin_role_id  -- Assign admin role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing employees to have admin role if they don't have one
UPDATE employees
SET 
  role_id = (SELECT id FROM employee_roles WHERE name = 'admin'),
  specialization = 'Administrator'
WHERE role_id IS NULL
   OR role_id NOT IN (SELECT id FROM employee_roles);

-- Ensure proper RLS policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can read their own record" ON employees;
DROP POLICY IF EXISTS "New users can create their record" ON employees;
DROP POLICY IF EXISTS "Users can update their own record" ON employees;

-- Create new policies
CREATE POLICY "Employees can read their own record"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "New users can create their record"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own record"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);