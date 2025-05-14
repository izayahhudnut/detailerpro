/*
  # Complete Authentication System Rebuild

  1. Drop existing tables and start fresh
  2. Create new schema with proper relationships
  3. Set up RLS policies correctly
*/

-- First drop all existing auth-related tables
DROP TABLE IF EXISTS employee_roles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Create a simpler employee_roles table
CREATE TABLE employee_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create the admin role
INSERT INTO employee_roles (name, description, permissions)
VALUES (
  'admin',
  'Full system access',
  '["clients", "tasks", "calendar", "inventory", "settings", "organization", "invoicing"]'
);

-- Create employees table with direct auth link
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  specialization text NOT NULL,
  hire_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  role_id uuid REFERENCES employee_roles(id),
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for roles
CREATE POLICY "Anyone can read roles"
  ON employee_roles
  FOR SELECT
  TO PUBLIC
  USING (true);

-- RLS policies for employees
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

-- Function to automatically set user_id on employee creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    (SELECT id FROM employee_roles WHERE name = 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();