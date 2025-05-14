/*
  # Add QA status to maintenance jobs

  1. Changes
    - Add 'qa' as a valid status for maintenance jobs
    - Update the check constraint to include the new status

  2. Notes
    - Uses a safe approach to modify the constraint without data loss
    - Maintains existing data integrity
*/

DO $$ 
BEGIN
  -- Temporarily disable the constraint
  ALTER TABLE maintenance_jobs 
  DROP CONSTRAINT IF EXISTS maintenance_jobs_status_check;

  -- Add the new constraint with updated status options
  ALTER TABLE maintenance_jobs
  ADD CONSTRAINT maintenance_jobs_status_check 
  CHECK (status IN ('not-started', 'in-progress', 'qa', 'done'));
END $$;