/*
  # Add cost tracking to job inventory

  1. Changes
    - Add `cost_at_time` column to `job_inventory` table to track historical costs
      - Uses numeric type to store precise monetary values
      - NOT NULL with default of 0 to ensure data consistency
      - This allows tracking the cost of items at the time they were used in a job

  2. Notes
    - The column stores the cost of the item at the time it was used
    - This helps with historical cost tracking and reporting
    - Default value ensures data integrity for existing and new records
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_inventory' 
    AND column_name = 'cost_at_time'
  ) THEN
    ALTER TABLE job_inventory 
    ADD COLUMN cost_at_time numeric NOT NULL DEFAULT 0;
  END IF;
END $$;