-- Ensure the cost_per_hour column exists (attempt to add it if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'cost_per_hour'
    ) THEN
        ALTER TABLE employees ADD COLUMN cost_per_hour NUMERIC DEFAULT 0 NOT NULL;
        COMMENT ON COLUMN employees.cost_per_hour IS 'Hourly cost rate for the employee';
    END IF;
END
$$;

-- Ensure the organization_id column exists (from earlier migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END
$$;

-- Add column to track last cost update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'cost_updated_at'
    ) THEN
        ALTER TABLE employees ADD COLUMN cost_updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- Update trigger to maintain cost_updated_at 
CREATE OR REPLACE FUNCTION update_employee_cost_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.cost_per_hour IS DISTINCT FROM NEW.cost_per_hour THEN
        NEW.cost_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS set_employee_cost_timestamp ON employees;
CREATE TRIGGER set_employee_cost_timestamp
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_employee_cost_timestamp();