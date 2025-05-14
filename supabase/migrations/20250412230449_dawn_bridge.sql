/*
  # Add Organization-based Data Isolation

  1. New Tables
    - `organizations`
      - Basic organization details
    - `inventory`
      - Inventory items and tools
    
  2. Changes
    - Add organization_id to all relevant tables
    - Update RLS policies to restrict by organization
    - Add foreign key constraints

  3. Security
    - Enable RLS on all tables
    - Add policies for organization access
*/

-- Create organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create inventory table
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('tool', 'product')),
  description text,
  quantity integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 5,
  unit text NOT NULL,
  location text,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  last_restocked timestamptz,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Add organization_id to users table
ALTER TABLE users
ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Add organization_id to clients
ALTER TABLE clients
ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Add organization_id to employees
ALTER TABLE employees
ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Add organization_id to progress_templates
ALTER TABLE progress_templates
ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for organizations
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  ));

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Public read clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;

CREATE POLICY "Users can read organization clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Users can create organization clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization());

CREATE POLICY "Users can update organization clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization());

-- Update RLS policies for employees
DROP POLICY IF EXISTS "Public read employees" ON employees;

CREATE POLICY "Users can read organization employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

-- Update RLS policies for inventory
CREATE POLICY "Users can read organization inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Users can create organization inventory"
  ON inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization());

CREATE POLICY "Users can update organization inventory"
  ON inventory
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization());

-- Update RLS policies for progress_templates
DROP POLICY IF EXISTS "Public read progress templates" ON progress_templates;

CREATE POLICY "Users can read organization templates"
  ON progress_templates
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

-- Update RLS policies for vehicles
DROP POLICY IF EXISTS "Users can read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles" ON vehicles;

CREATE POLICY "Users can read organization vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients 
    WHERE organization_id = get_user_organization()
  ));

CREATE POLICY "Users can insert organization vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id IN (
    SELECT id FROM clients 
    WHERE organization_id = get_user_organization()
  ));

CREATE POLICY "Users can update organization vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients 
    WHERE organization_id = get_user_organization()
  ));

CREATE POLICY "Users can delete organization vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients 
    WHERE organization_id = get_user_organization()
  ));

-- Update handle_new_user function to create organization
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Create organization for new user
  INSERT INTO organizations (name)
  VALUES (split_part(NEW.email, '@', 2))
  RETURNING id INTO org_id;

  -- Create user record with organization
  INSERT INTO users (
    id,
    email,
    full_name,
    organization_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    org_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;