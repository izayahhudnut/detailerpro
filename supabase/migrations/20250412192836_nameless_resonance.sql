/*
  # Add foreign key relationship for employee certifications

  1. Changes
    - Add foreign key constraint to employee_certifications table
    - Add cascade delete to ensure certifications are removed when an employee is deleted

  2. Security
    - No changes to RLS policies needed
*/

-- Add foreign key constraint
ALTER TABLE employee_certifications
ADD CONSTRAINT employee_certifications_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES employees(id)
ON DELETE CASCADE;