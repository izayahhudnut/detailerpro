/*
  # Delete all employees and reset related data

  1. Changes
    - Delete all records from employees table
    - Delete related maintenance jobs
    - Reset sequences if any
*/

-- Delete maintenance jobs that reference employees
DELETE FROM maintenance_jobs
WHERE employee_id IN (SELECT id FROM employees);

-- Delete all employee records
DELETE FROM employees;