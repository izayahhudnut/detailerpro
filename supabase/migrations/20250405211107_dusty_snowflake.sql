/*
  # Add user creation trigger

  1. New Functions
    - `handle_new_user`: Creates an employee record when a new user signs up
  
  2. Triggers
    - Add trigger on auth.users table to call handle_new_user function
    
  3. Security
    - Function executes with security definer to ensure it has necessary permissions
*/

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'general',  -- Default specialization
    CURRENT_DATE,
    'active'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the function has appropriate permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;