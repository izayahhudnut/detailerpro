/*
  # Update RLS policies for employee management

  1. Security Changes
    - Add missing RLS policies for employee_certifications table:
      - Allow authenticated users to delete certifications
*/

DO $$ 
BEGIN
  -- Only create the delete policy for employee_certifications as it's missing
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'employee_certifications' 
    AND policyname = 'Allow authenticated users to delete employee certifications'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete employee certifications"
      ON employee_certifications
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;