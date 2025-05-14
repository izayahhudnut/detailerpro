/*
  # Delete All Users and Related Data

  1. Changes
    - Delete all data in a safe order respecting foreign key constraints
    - Clean up all related records
    - Remove all auth users
*/

-- First delete job_inventory records
DELETE FROM job_inventory;

-- Delete maintenance todos
DELETE FROM maintenance_todos;

-- Delete maintenance jobs
DELETE FROM maintenance_jobs;

-- Delete vehicles
DELETE FROM vehicles;

-- Delete clients
DELETE FROM clients;

-- Delete inventory items
DELETE FROM inventory_items;

-- Delete progress steps
DELETE FROM progress_steps;

-- Delete progress templates
DELETE FROM progress_templates;

-- Delete employee certifications
DELETE FROM employee_certifications;

-- Delete employees
DELETE FROM employees;

-- Delete employee roles except admin
DELETE FROM employee_roles
WHERE name != 'admin';

-- Finally delete auth users
DELETE FROM auth.users;