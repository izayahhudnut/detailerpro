/*
  # Add User Authentication and RLS Policies

  1. Changes
    - Add user_id column to relevant tables
    - Update RLS policies to restrict access by user_id
    - Add trigger to set user_id on insert
    
  2. Security
    - Enable RLS on all tables
    - Add policies to restrict data access to authenticated users
*/

-- Add user_id to clients
ALTER TABLE clients
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add user_id to employees
ALTER TABLE employees
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add user_id to inventory_items
ALTER TABLE inventory_items
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add user_id to progress_templates
ALTER TABLE progress_templates
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Public read clients" ON clients;
DROP POLICY IF EXISTS "Public insert clients" ON clients;
DROP POLICY IF EXISTS "Public update clients" ON clients;
DROP POLICY IF EXISTS "Public delete clients" ON clients;

CREATE POLICY "Users can read own clients"
ON clients FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
ON clients FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
ON clients FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update RLS policies for employees
DROP POLICY IF EXISTS "Public read employees" ON employees;
DROP POLICY IF EXISTS "Public insert employees" ON employees;
DROP POLICY IF EXISTS "Public update employees" ON employees;
DROP POLICY IF EXISTS "Public delete employees" ON employees;

CREATE POLICY "Users can read own employees"
ON employees FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
ON employees FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
ON employees FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
ON employees FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update RLS policies for inventory_items
DROP POLICY IF EXISTS "Public read inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Public insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Public update inventory items" ON inventory_items;

CREATE POLICY "Users can read own inventory items"
ON inventory_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items"
ON inventory_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory items"
ON inventory_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Update RLS policies for progress_templates
DROP POLICY IF EXISTS "Public read progress templates" ON progress_templates;
DROP POLICY IF EXISTS "Public insert progress templates" ON progress_templates;
DROP POLICY IF EXISTS "Public update progress templates" ON progress_templates;
DROP POLICY IF EXISTS "Public delete progress templates" ON progress_templates;

CREATE POLICY "Users can read own progress templates"
ON progress_templates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress templates"
ON progress_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress templates"
ON progress_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress templates"
ON progress_templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id
CREATE TRIGGER set_clients_user_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_employees_user_id
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_inventory_items_user_id
  BEFORE INSERT ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_progress_templates_user_id
  BEFORE INSERT ON progress_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();