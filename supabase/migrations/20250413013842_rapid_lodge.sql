/*
  # Delete all clients and related data

  1. Changes
    - Delete maintenance jobs that reference vehicles owned by clients
    - Delete vehicles owned by clients
    - Delete all client records
    
  2. Notes
    - Uses CASCADE where available
    - Handles foreign key relationships safely
*/

-- First delete maintenance jobs that reference vehicles owned by clients
DELETE FROM maintenance_jobs
WHERE vehicle_id IN (
  SELECT id FROM vehicles
  WHERE client_id IN (
    SELECT id FROM clients
  )
);

-- Delete vehicles owned by clients
DELETE FROM vehicles
WHERE client_id IN (
  SELECT id FROM clients
);

-- Finally delete all client records
DELETE FROM clients;