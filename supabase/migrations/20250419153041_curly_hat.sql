-- Drop existing tables if they exist
DROP TABLE IF EXISTS progress_steps CASCADE;
DROP TABLE IF EXISTS progress_templates CASCADE;

-- Create simple progress_templates table
CREATE TABLE progress_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create simple progress_steps table
CREATE TABLE progress_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES progress_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS but with simple public access
ALTER TABLE progress_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_steps ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations
CREATE POLICY "Allow all operations on templates"
  ON progress_templates FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on steps"
  ON progress_steps FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add todos column to maintenance_jobs
ALTER TABLE maintenance_jobs ADD COLUMN IF NOT EXISTS todos jsonb DEFAULT '[]'::jsonb;