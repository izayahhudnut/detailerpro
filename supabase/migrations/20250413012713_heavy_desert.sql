-- First drop all organization-related policies
DROP POLICY IF EXISTS "Users can read organization clients" ON clients;
DROP POLICY IF EXISTS "Users can update organization clients" ON clients;
DROP POLICY IF EXISTS "Users can create organization clients" ON clients;
DROP POLICY IF EXISTS "Users can read organization vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert organization vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update organization vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete organization vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can read organization inventory" ON inventory;
DROP POLICY IF EXISTS "Users can create organization inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update organization inventory" ON inventory;
DROP POLICY IF EXISTS "Users can read organization templates" ON progress_templates;

-- Now we can safely drop the organization columns
ALTER TABLE clients DROP COLUMN IF EXISTS organization_id;
ALTER TABLE inventory DROP COLUMN IF EXISTS organization_id;
ALTER TABLE employees DROP COLUMN IF EXISTS organization_id;
ALTER TABLE progress_templates DROP COLUMN IF EXISTS organization_id;

-- Update RLS policies to allow public access
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
CREATE POLICY "Allow all operations on clients"
  ON clients FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on inventory" ON inventory;
CREATE POLICY "Allow all operations on inventory"
  ON inventory FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on employees" ON employees;
CREATE POLICY "Allow all operations on employees"
  ON employees FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE progress_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on progress_templates" ON progress_templates;
CREATE POLICY "Allow all operations on progress_templates"
  ON progress_templates FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);