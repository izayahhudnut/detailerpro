/*
  # Add year column to vehicles table

  1. Changes
    - Add `year` column to `vehicles` table
      - Type: text
      - Not nullable
      - No default value

  2. Notes
    - The year column is required for storing vehicle manufacturing year
    - Using text type to allow for flexible year formats
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' 
    AND column_name = 'year'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN year text NOT NULL;
  END IF;
END $$;