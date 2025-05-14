/*
  # Update maintenance todos with progress steps

  1. New Tables
    - `progress_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)

    - `progress_steps`
      - `id` (uuid, primary key)
      - `template_id` (uuid, references progress_templates)
      - `title` (text)
      - `description` (text)
      - `order` (integer)
      - `created_at` (timestamptz)

  2. Changes to maintenance_jobs
    - Add `template_id` (uuid, references progress_templates)
    - Add `notification_phone` (text)

  3. Changes to maintenance_todos
    - Add `step_id` (uuid, references progress_steps)
*/

-- Create progress templates table
CREATE TABLE progress_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read progress templates"
  ON progress_templates
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert progress templates"
  ON progress_templates
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update progress templates"
  ON progress_templates
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete progress templates"
  ON progress_templates
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Create progress steps table
CREATE TABLE progress_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES progress_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read progress steps"
  ON progress_steps
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert progress steps"
  ON progress_steps
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update progress steps"
  ON progress_steps
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete progress steps"
  ON progress_steps
  FOR DELETE
  TO PUBLIC
  USING (true);

-- Add new columns to maintenance_jobs
ALTER TABLE maintenance_jobs
ADD COLUMN template_id uuid REFERENCES progress_templates(id),
ADD COLUMN notification_phone text;

-- Add step_id to maintenance_todos
ALTER TABLE maintenance_todos
ADD COLUMN step_id uuid REFERENCES progress_steps(id);