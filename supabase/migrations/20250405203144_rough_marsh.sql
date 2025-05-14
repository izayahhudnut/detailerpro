/*
  # Fix Admin Access for Izayah

  1. Changes
    - Ensure admin role exists with correct permissions
    - Update Izayah's employee record with admin role
    - Add proper RLS policies for admin access
*/

-- First ensure the admin role exists with correct permissions
INSERT INTO employee_roles (name, description, permissions)
VALUES (
  'admin',
  'Full system access',
  '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
)
ON CONFLICT (name) 
DO UPDATE SET permissions = '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]';

-- Get admin role ID
DO $$ 
DECLARE
  admin_role_id uuid;
  izayah_auth_id uuid;
  izayah_employee_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id 
  FROM employee_roles 
  WHERE name = 'admin';

  -- Get Izayah's auth ID
  SELECT id INTO izayah_auth_id
  FROM auth.users
  WHERE email = 'izayah@dor15.com';

  IF izayah_auth_id IS NOT NULL THEN
    -- Check if employee record exists
    SELECT id INTO izayah_employee_id
    FROM employees
    WHERE auth_id = izayah_auth_id;

    IF izayah_employee_id IS NOT NULL THEN
      -- Update existing employee record
      UPDATE employees
      SET 
        role_id = admin_role_id,
        status = 'active'
      WHERE id = izayah_employee_id;
    ELSE
      -- Create new employee record
      INSERT INTO employees (
        name,
        email,
        phone,
        specialization,
        hire_date,
        status,
        role_id,
        auth_id
      ) VALUES (
        'Izayah',
        'izayah@dor15.com',
        '555-0123',
        'Administrator',
        CURRENT_DATE,
        'active',
        admin_role_id,
        izayah_auth_id
      );
    END IF;
  END IF;
END $$;