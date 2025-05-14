/*
  # Verify and Fix Admin Access

  1. Changes
    - Ensure admin role exists with correct permissions
    - Verify Izayah's employee record and role
    - Add debug logging
*/

DO $$ 
DECLARE
  admin_role_id uuid;
  izayah_auth_id uuid;
  izayah_employee_id uuid;
  izayah_role_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id 
  FROM employee_roles 
  WHERE name = 'admin';

  -- Get Izayah's auth ID
  SELECT id INTO izayah_auth_id
  FROM auth.users
  WHERE email = 'izayah@dor15.com';

  -- Get Izayah's employee record
  SELECT id, role_id INTO izayah_employee_id, izayah_role_id
  FROM employees
  WHERE auth_id = izayah_auth_id;

  -- Log the current state
  RAISE NOTICE 'Admin Role ID: %', admin_role_id;
  RAISE NOTICE 'Izayah Auth ID: %', izayah_auth_id;
  RAISE NOTICE 'Izayah Employee ID: %', izayah_employee_id;
  RAISE NOTICE 'Izayah Current Role ID: %', izayah_role_id;

  -- Ensure admin role exists with correct permissions
  INSERT INTO employee_roles (name, description, permissions)
  VALUES (
    'admin',
    'Full system access',
    '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
  )
  ON CONFLICT (name) 
  DO UPDATE SET permissions = '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
  RETURNING id INTO admin_role_id;

  -- Update or create Izayah's employee record
  IF izayah_employee_id IS NOT NULL THEN
    -- Update existing record
    UPDATE employees
    SET 
      role_id = admin_role_id,
      status = 'active'
    WHERE id = izayah_employee_id;
    
    RAISE NOTICE 'Updated existing employee record';
  ELSIF izayah_auth_id IS NOT NULL THEN
    -- Create new record
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
    
    RAISE NOTICE 'Created new employee record';
  END IF;

  -- Verify the update
  SELECT role_id INTO izayah_role_id
  FROM employees
  WHERE auth_id = izayah_auth_id;
  
  RAISE NOTICE 'Final Role ID: %', izayah_role_id;
END $$;