/*
  # Fix Admin Role Assignment

  1. Changes
    - Add unique constraint on employee_roles name
    - Create or update admin role
    - Update Izayah's employee record
*/

-- First add unique constraint on role name
ALTER TABLE employee_roles
ADD CONSTRAINT employee_roles_name_key UNIQUE (name);

DO $$ 
DECLARE
  admin_role_id uuid;
  izayah_auth_id uuid;
BEGIN
  -- Get or create admin role
  INSERT INTO employee_roles (name, description, permissions)
  VALUES (
    'admin',
    'Full system access',
    '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
  )
  ON CONFLICT (name) DO UPDATE
  SET permissions = '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
  RETURNING id INTO admin_role_id;

  -- Get Izayah's auth ID
  SELECT id INTO izayah_auth_id
  FROM auth.users
  WHERE email = 'izayah@dor15.com';

  -- Update Izayah's employee record
  UPDATE employees
  SET 
    role_id = admin_role_id,
    status = 'active'
  WHERE auth_id = izayah_auth_id;

  -- If no employee record exists, create one
  IF NOT FOUND AND izayah_auth_id IS NOT NULL THEN
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
END $$;