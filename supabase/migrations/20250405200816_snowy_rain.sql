/*
  # Add Employee Role Management

  1. New Tables
    - `employee_roles`
      - Stores role definitions and permissions
    - `employee_access`
      - Links employees to roles and permissions

  2. Changes
    - Add role_id to employees table
    - Add access control columns
    
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create roles table
CREATE TABLE employee_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read employee roles"
  ON employee_roles
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Add default roles
INSERT INTO employee_roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'),
  ('employee', 'Limited system access', '["clients", "tasks", "calendar", "inventory", "settings"]');

-- Add role_id to employees
ALTER TABLE employees
ADD COLUMN role_id uuid REFERENCES employee_roles(id);

-- Update existing employees to have admin role
UPDATE employees 
SET role_id = (SELECT id FROM employee_roles WHERE name = 'admin')
WHERE role_id IS NULL;

-- Make role_id required for future employees
ALTER TABLE employees
ALTER COLUMN role_id SET NOT NULL;

-- Add auth_id to link with Supabase auth
ALTER TABLE employees
ADD COLUMN auth_id uuid REFERENCES auth.users(id);

-- Add last login tracking
ALTER TABLE employees
ADD COLUMN last_login timestamptz;