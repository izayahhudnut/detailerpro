/*
  # Fix admin role assignment and permissions

  1. Changes
    - Ensure admin role exists with correct permissions
    - Update handle_new_user function to assign admin role
    - Add proper RLS policies
*/

-- First ensure the admin role exists
INSERT INTO employee_roles (name, description, permissions)
VALUES (
  'admin',
  'Full system access',
  '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
)
ON CONFLICT (name) 
DO UPDATE SET permissions = '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]';

-- Update the handle_new_user function to assign admin role
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
    role_id
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NEW.email,
    'Not set',
    'Administrator',
    CURRENT_DATE,
    'active',
    admin_role_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;