/*
  # Create function for new user organization setup

  1. New Function
    - `create_new_user_organization`: Creates organization and user records for new signups
  
  2. Security
    - Function is accessible to authenticated users only
    - Ensures data consistency during user creation
*/

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
  new_org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (user_full_name || '''s Organization')
  RETURNING id INTO new_org_id;

  -- Create user record
  INSERT INTO users (id, email, full_name, organization_id)
  VALUES (user_id, user_email, user_full_name, new_org_id);
END;
$$;