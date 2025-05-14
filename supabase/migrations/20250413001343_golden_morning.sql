/*
  # Add auth_id to employees table

  1. Changes
    - Add auth_id column to employees table
    - Add foreign key constraint to link with auth.users
    - Add unique constraint on auth_id
    - Add unique constraint on email

  2. Security
    - No changes to RLS policies needed
*/

-- Add auth_id column and constraints
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id);

-- Add unique constraints
ALTER TABLE employees
ADD CONSTRAINT employees_auth_id_key UNIQUE (auth_id);

ALTER TABLE employees
ADD CONSTRAINT employees_email_key UNIQUE (email);