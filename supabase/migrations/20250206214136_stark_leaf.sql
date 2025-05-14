/*
  # Add todo lists to maintenance jobs

  1. New Tables
    - `maintenance_todos`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references maintenance_jobs)
      - `description` (text)
      - `completed` (boolean)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `maintenance_todos` table
    - Add policies for public access (consistent with other tables)
*/

CREATE TABLE maintenance_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  description text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE maintenance_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read maintenance todos"
  ON maintenance_todos
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert maintenance todos"
  ON maintenance_todos
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update maintenance todos"
  ON maintenance_todos
  FOR UPDATE
  TO PUBLIC
  USING (true);

CREATE POLICY "Public delete maintenance todos"
  ON maintenance_todos
  FOR DELETE
  TO PUBLIC
  USING (true);