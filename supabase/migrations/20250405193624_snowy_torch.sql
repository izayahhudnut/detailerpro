/*
  # Add cost per unit to inventory items

  1. Changes
    - Add `cost_per_unit` column to `inventory_items` table
      - Type: numeric
      - Default: 0
      - Not nullable
      - Description: Cost per unit of the inventory item

  2. Notes
    - Uses numeric type to handle decimal values accurately
    - Sets default value to 0 to maintain data consistency
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' 
    AND column_name = 'cost_per_unit'
  ) THEN
    ALTER TABLE inventory_items 
    ADD COLUMN cost_per_unit numeric NOT NULL DEFAULT 0;
  END IF;
END $$;