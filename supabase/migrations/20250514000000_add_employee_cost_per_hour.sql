-- Add cost_per_hour column to employees table
ALTER TABLE employees ADD COLUMN cost_per_hour NUMERIC DEFAULT 0 NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN employees.cost_per_hour IS 'Hourly cost rate for the employee';