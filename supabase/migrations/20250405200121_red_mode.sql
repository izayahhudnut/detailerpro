/*
  # Add used_at column to job_inventory table

  1. Changes
    - Add `used_at` timestamp column to `job_inventory` table
    - Set default value to `now()`
    - Make column nullable to maintain compatibility with existing records

  2. Notes
    - This migration adds tracking for when inventory items are used in jobs
    - Existing records will have NULL for used_at
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_inventory' 
    AND column_name = 'used_at'
  ) THEN
    ALTER TABLE job_inventory 
    ADD COLUMN used_at timestamptz DEFAULT now();
  END IF;
END $$;