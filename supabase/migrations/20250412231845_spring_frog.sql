/*
  # Fix Authentication and RLS Policies

  1. Changes
    - Drop existing policies before recreating
    - Add organization policies
    - Update handle_new_user function
*/

-- First enable RLS on all relevant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Public read organizations" ON organizations;
DROP POLICY IF EXISTS "Public insert organizations" ON organizations;

-- Add policies for organizations
CREATE POLICY "Public insert organizations"
  ON organizations
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public read organizations"
  ON organizations
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id uuid;
BEGIN
  -- First create the organization
  INSERT INTO organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', NEW.email || ' Organization'))
  RETURNING id INTO org_id;

  -- Then create the user record
  INSERT INTO users (
    id,
    email,
    full_name,
    organization_id,
    is_admin
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    org_id,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;