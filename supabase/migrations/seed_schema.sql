-- Ensure they have the correct table for their frontend work
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    symptom_name text NOT NULL,
    intensity_score int,
    created_at timestamptz DEFAULT now()
);

-- Apply the RLS policy we discussed
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
