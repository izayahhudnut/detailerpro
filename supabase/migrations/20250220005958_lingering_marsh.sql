/*
  # Add FlightAware Integration Support

  1. New Tables
    - `flightaware_config`
      - Stores API credentials and configuration
    - `flight_tracking_data`
      - Stores cached flight data from FlightAware
  
  2. Changes
    - Add FlightAware tracking ID to aircraft table
    
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- FlightAware configuration table
CREATE TABLE flightaware_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  enabled boolean DEFAULT true,
  last_sync timestamptz,
  sync_interval interval DEFAULT '5 minutes',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flightaware_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read flightaware config"
  ON flightaware_config
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public update flightaware config"
  ON flightaware_config
  FOR UPDATE
  TO PUBLIC
  USING (true);

-- Flight tracking data table
CREATE TABLE flight_tracking_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  flight_id text NOT NULL,
  departure_airport text,
  arrival_airport text,
  departure_time timestamptz,
  arrival_time timestamptz,
  altitude integer,
  groundspeed integer,
  heading integer,
  latitude numeric,
  longitude numeric,
  status text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flight_tracking_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read flight tracking data"
  ON flight_tracking_data
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public insert flight tracking data"
  ON flight_tracking_data
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Public update flight tracking data"
  ON flight_tracking_data
  FOR UPDATE
  TO PUBLIC
  USING (true);

-- Add FlightAware tracking ID to aircraft
ALTER TABLE aircraft
ADD COLUMN flightaware_id text;

-- Create index for faster lookups
CREATE INDEX idx_aircraft_flightaware_id ON aircraft(flightaware_id);

-- Create function to update flight tracking data
CREATE OR REPLACE FUNCTION update_aircraft_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the aircraft_tracking status based on flight data
  UPDATE aircraft_tracking
  SET 
    flight_status = NEW.status,
    current_location = CASE 
      WHEN NEW.status = 'in-flight' THEN 
        COALESCE(NEW.departure_airport || ' to ' || NEW.arrival_airport, 'In Flight')
      WHEN NEW.status = 'landed' THEN 
        NEW.arrival_airport
      ELSE 
        NEW.departure_airport
    END,
    updated_at = now()
  WHERE aircraft_id = NEW.aircraft_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update aircraft status
CREATE TRIGGER update_aircraft_status_trigger
  AFTER INSERT OR UPDATE ON flight_tracking_data
  FOR EACH ROW
  EXECUTE FUNCTION update_aircraft_status();