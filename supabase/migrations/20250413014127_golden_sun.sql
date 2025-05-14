-- Drop auth-related tables and functions
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove auth_id from employees
ALTER TABLE employees DROP COLUMN IF EXISTS auth_id;

-- Update RLS policies to allow public access
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON employees;
CREATE POLICY "Allow all operations"
  ON employees FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Update other tables' RLS policies
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON maintenance_jobs;
CREATE POLICY "Allow all operations"
  ON maintenance_jobs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON clients;
CREATE POLICY "Allow all operations"
  ON clients FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON vehicles;
CREATE POLICY "Allow all operations"
  ON vehicles FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON inventory;
CREATE POLICY "Allow all operations"
  ON inventory FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE progress_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON progress_templates;
CREATE POLICY "Allow all operations"
  ON progress_templates FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);