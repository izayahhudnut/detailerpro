-- Drop everything and start fresh
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS create_new_user_organization CASCADE;

-- Create organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Allow all operations" ON organizations FOR ALL TO public USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL TO public USING (true);

-- Function to create new user with organization
CREATE OR REPLACE FUNCTION create_new_user_organization(
  user_id uuid,
  user_email text,
  user_full_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (user_full_name || '''s Organization')
  RETURNING id INTO org_id;

  -- Create user record
  INSERT INTO users (id, email, full_name, organization_id)
  VALUES (user_id, user_email, user_full_name, org_id);
END;
$$;