-- First ensure admin role exists
INSERT INTO employee_roles (name, description, permissions)
VALUES (
  'admin',
  'Full system access',
  '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
)
ON CONFLICT (name) 
DO UPDATE SET permissions = '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]';

-- Update handle_new_user function to always assign admin role
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', 'Not set'),
    'Administrator',
    CURRENT_DATE,
    'active',
    admin_role_id  -- Always assign admin role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing employees to have admin role
UPDATE employees
SET 
  role_id = (SELECT id FROM employee_roles WHERE name = 'admin'),
  specialization = 'Administrator'
WHERE role_id IS NULL
   OR role_id NOT IN (SELECT id FROM employee_roles)
   OR role_id = (SELECT id FROM employee_roles WHERE name = 'employee');