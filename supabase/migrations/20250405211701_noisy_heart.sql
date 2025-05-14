/*
  # Fix employee permissions and role assignment

  1. Changes
    - Add default employee role with basic permissions
    - Update handle_new_user function to assign default role
    - Ensure existing users have proper permissions
*/

-- First ensure we have both admin and default roles
INSERT INTO employee_roles (name, description, permissions)
VALUES 
  (
    'admin',
    'Full system access',
    '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
  ),
  (
    'employee',
    'Basic system access',
    '["clients", "tasks", "calendar", "inventory", "settings"]'
  )
ON CONFLICT (name) 
DO UPDATE SET permissions = EXCLUDED.permissions;

-- Update handle_new_user function to assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID (employee role)
  SELECT id INTO default_role_id 
  FROM employee_roles 
  WHERE name = 'employee';

  -- Create employee record with default role
  INSERT INTO public.employees (
    auth_id,
    name,
    email,
    phone,
    specialization,
    hire_date,
    status,
    role_id
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NEW.email,
    'Not set',
    'General',
    CURRENT_DATE,
    'active',
    default_role_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all existing employees have a role
UPDATE employees
SET role_id = (
  SELECT id FROM employee_roles WHERE name = 'employee'
)
WHERE role_id IS NULL;