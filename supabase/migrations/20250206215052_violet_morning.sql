/*
  # Inventory and Asset Tracking System

  1. New Tables
    - `inventory_items`
      - Tools and products used in maintenance
      - Tracks stock levels and availability
    - `job_inventory`
      - Links maintenance jobs with inventory items used
    - `aircraft_tracking`
      - Real-time aircraft status and maintenance history
    
  2. Security
    - Enable RLS on all new tables
    - Public access policies for read/write operations
*/

-- Inventory items table
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('tool', 'product')),
  description text,
  quantity integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 5,
  unit text NOT NULL,
  location text,
  last_restocked timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read inventory items"
  ON inventory_items
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert inventory items"
  ON inventory_items
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update inventory items"
  ON inventory_items
  FOR UPDATE
  TO PUBLIC
  USING (true);

-- Job inventory relationship
CREATE TABLE job_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id),
  quantity_used integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read job inventory"
  ON job_inventory
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert job inventory"
  ON job_inventory
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update job inventory"
  ON job_inventory
  FOR UPDATE
  TO PUBLIC
  USING (true);

-- Aircraft tracking
CREATE TABLE aircraft_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  flight_status text CHECK (flight_status IN ('grounded', 'maintenance', 'scheduled', 'in-flight', 'landed')),
  current_location text,
  flight_hours integer DEFAULT 0,
  last_maintenance timestamptz,
  next_maintenance_due timestamptz,
  maintenance_notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aircraft_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read aircraft tracking"
  ON aircraft_tracking
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert aircraft tracking"
  ON aircraft_tracking
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update aircraft tracking"
  ON aircraft_tracking
  FOR UPDATE
  TO PUBLIC
  USING (true);

-- Add triggers to update inventory quantities
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE inventory_items
    SET quantity = quantity - NEW.quantity_used
    WHERE id = NEW.item_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE inventory_items
    SET quantity = quantity + OLD.quantity_used - NEW.quantity_used
    WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE inventory_items
    SET quantity = quantity + OLD.quantity_used
    WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_after_job
  AFTER INSERT OR UPDATE OR DELETE ON job_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity();