/*
  # Delete all inventory records

  1. Changes
    - Delete job_inventory records first (to handle foreign key constraints)
    - Delete all inventory items
    
  2. Notes
    - Handles deletion in correct order to respect foreign key relationships
    - Safe operation that maintains referential integrity
*/

-- First delete job_inventory records that reference inventory items
DELETE FROM job_inventory;

-- Then delete all inventory items
DELETE FROM inventory;