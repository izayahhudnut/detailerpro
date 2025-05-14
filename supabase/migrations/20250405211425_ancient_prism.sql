/*
  # Fix user authentication setup

  1. Changes
    - Enable Row Level Security on auth.users
    - Add policies for user management
    - Add trigger for handling new user creation
    - Fix employee creation on signup

  2. Security
    - Enable RLS on auth schema tables
    - Add policies for secure user management
    - Ensure proper user creation flow
*/

-- Enable RLS on auth schema tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Add policies for user management
CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create employee record for new user
  INSERT INTO public.employees (
    auth_id,
    name,
    email,
    phone,
    specialization,
    hire_date,
    status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'general',  -- Default specialization
    CURRENT_DATE,
    'active'
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user handling
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();