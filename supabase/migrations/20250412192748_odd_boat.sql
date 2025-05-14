/*
  # Delete admin user and related records

  1. Changes
    - Delete records in correct order to handle all foreign key constraints
    - Clean up all related records before deleting auth user
    - Handle job_inventory, inventory items, clients, and employee records
*/

-- First delete job_inventory records that reference inventory items
DELETE FROM job_inventory
WHERE item_id IN (
  SELECT id FROM inventory_items
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'izayah@dor15.com')
);

-- Now safe to delete inventory items
DELETE FROM inventory_items
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'izayah@dor15.com');

-- Delete maintenance jobs related to vehicles owned by this user's clients
DELETE FROM maintenance_jobs
WHERE vehicle_id IN (
  SELECT v.id 
  FROM vehicles v
  JOIN clients c ON v.client_id = c.id
  WHERE c.user_id = (SELECT id FROM auth.users WHERE email = 'izayah@dor15.com')
);

-- Delete vehicles owned by this user's clients
DELETE FROM vehicles
WHERE client_id IN (
  SELECT id FROM clients
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'izayah@dor15.com')
);

-- Delete client records
DELETE FROM clients
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'izayah@dor15.com');

-- Delete progress templates
DELETE FROM progress_templates
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'izayah@dor15.com');

-- Delete employee record
DELETE FROM employees
WHERE email = 'izayah@dor15.com';

-- Finally delete the auth user
DELETE FROM auth.users
WHERE email = 'izayah@dor15.com';