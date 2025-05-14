-- Create todos table for task progress tracking
CREATE TABLE public.todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.maintenance_jobs(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.progress_steps(id) ON DELETE CASCADE,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(job_id, step_id)
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Add postgres trigger to update updated_at column
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create RLS policies for todos
CREATE POLICY "Authenticated users can select todos" ON public.todos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert todos" ON public.todos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update todos" ON public.todos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete todos" ON public.todos
FOR DELETE
TO authenticated
USING (true);

-- Create index on job_id for better query performance
CREATE INDEX todos_job_id_idx ON public.todos(job_id);