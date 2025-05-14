/*
  # Create function for user signup

  1. New Function
    - `create_new_user`: Creates a new user with organization in a transaction
      - Parameters:
        - p_email: User's email
        - p_password: User's password
        - p_full_name: User's full name
      
  2. Security
    - Function is accessible to public
    - Handles user creation atomically
*/

CREATE OR REPLACE FUNCTION create_new_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Create organization first
  INSERT INTO organizations (name)
  VALUES (p_full_name || '''s Organization')
  RETURNING id INTO v_org_id;

  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Create user record
  INSERT INTO users (
    id,
    email,
    full_name,
    organization_id,
    is_admin
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    v_org_id,
    true
  );

  RETURN v_user_id;
EXCEPTION
  WHEN others THEN
    -- Rollback will happen automatically
    RAISE EXCEPTION 'Error creating new user: %', SQLERRM;
END;
$$;