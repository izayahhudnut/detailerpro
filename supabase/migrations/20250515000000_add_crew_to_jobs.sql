-- Add crew_id to maintenance_jobs table
ALTER TABLE maintenance_jobs ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES crews(id) ON DELETE SET NULL;

-- Make employee_id nullable when a crew is assigned
ALTER TABLE maintenance_jobs ALTER COLUMN employee_id DROP NOT NULL;

-- Add check constraint to ensure either employee_id or crew_id is set
ALTER TABLE maintenance_jobs ADD CONSTRAINT job_has_employee_or_crew CHECK (
  employee_id IS NOT NULL OR crew_id IS NOT NULL
);

-- Add index on crew_id for better query performance
CREATE INDEX IF NOT EXISTS maintenance_jobs_crew_id_idx ON maintenance_jobs(crew_id);

-- Add comments for documentation
COMMENT ON COLUMN maintenance_jobs.crew_id IS 'The crew assigned to this job';
COMMENT ON COLUMN maintenance_jobs.employee_id IS 'The employee assigned to this job (can be null if a crew is assigned)';