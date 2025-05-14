/*
  # Add employee password management

  1. Changes
    - Add password_hash column to employees table
    - Add password_set_at column to track when password was last set
    - Add password_reset_required column for forcing password changes
*/

ALTER TABLE employees
ADD COLUMN password_hash text,
ADD COLUMN password_set_at timestamptz,
ADD COLUMN password_reset_required boolean DEFAULT false;

-- Update RLS policies to allow admins to manage passwords
CREATE POLICY "Admins can update employee passwords"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employee_roles er
    WHERE er.id = auth.uid()
    AND er.name = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM employee_roles er
    WHERE er.id = auth.uid()
    AND er.name = 'admin'
  ));