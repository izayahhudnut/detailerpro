/*
  # Update RLS policies for progress_steps table

  1. Security Changes
    - Enable RLS on progress_steps table
    - Add policy for authenticated users to read progress steps
    - Add policy for authenticated users to insert progress steps
*/

ALTER TABLE progress_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read progress steps"
  ON progress_steps
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert progress steps"
  ON progress_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (true);