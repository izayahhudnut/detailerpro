/*
  # Set up admin user and link to auth

  1. Changes
    - Create employee record for admin user
    - Link employee to auth user
    - Assign admin role
*/

-- Get admin role ID
DO $$ 
DECLARE
  admin_role_id uuid;
  auth_user_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id 
  FROM employee_roles 
  WHERE name = 'admin';

  -- Get the auth user ID for the admin email
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'Izayah@dor15.com';

  -- Create employee record if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM employees WHERE auth_id = auth_user_id
  ) AND auth_user_id IS NOT NULL THEN
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
      'Izayah@dor15.com',
      '555-0123',
      'Administrator',
      CURRENT_DATE,
      'active',
      admin_role_id,
      auth_user_id
    );
  END IF;
END $$;