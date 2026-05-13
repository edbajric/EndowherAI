-- ============================================================
-- EndowherAI Database Schema
-- Privacy-first: health data linked by pseudonym_id, NOT email
-- ============================================================

-- 1. User Profiles (identity layer — separated from health data)
-- NOTE: user_profiles table + auto-create trigger are managed
-- directly in Supabase dashboard. The table contains:
--   auth_id (uuid, references auth.users)
--   pseudonym_id (uuid, auto-generated)
--   consent_flag (boolean)
--   consent_timestamp (timestamptz)

-- 2. Symptom Logs (daily diary entries)
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pseudonym_id uuid NOT NULL,
    log_date date NOT NULL DEFAULT now()::date,
    pain_level int CHECK (pain_level >= 0 AND pain_level <= 10),
    cycle_day int CHECK (cycle_day >= 1 AND cycle_day <= 60),
    bleeding_intensity text,
    mood text,
    fatigue_level int CHECK (fatigue_level >= 0 AND fatigue_level <= 10),
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own symptom logs"
    ON public.symptom_logs FOR SELECT
    USING (
        pseudonym_id IN (
            SELECT pseudonym_id FROM public.user_profiles
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own symptom logs"
    ON public.symptom_logs FOR INSERT
    WITH CHECK (
        pseudonym_id IN (
            SELECT pseudonym_id FROM public.user_profiles
            WHERE auth_id = auth.uid()
        )
    );

-- 3. Weekly Logs (weekly check-in summaries)
CREATE TABLE IF NOT EXISTS public.weekly_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pseudonym_id uuid NOT NULL,
    week_start date NOT NULL DEFAULT (now()::date - EXTRACT(DOW FROM now())::int),
    avg_pain int CHECK (avg_pain >= 0 AND avg_pain <= 10),
    bloating int CHECK (bloating >= 0 AND bloating <= 10),
    sleep_quality int CHECK (sleep_quality >= 0 AND sleep_quality <= 4),
    anxiety int CHECK (anxiety >= 0 AND anxiety <= 4),
    bowel_symptoms int CHECK (bowel_symptoms >= 0 AND bowel_symptoms <= 10),
    urinary_symptoms int CHECK (urinary_symptoms >= 0 AND urinary_symptoms <= 10),
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.weekly_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own weekly logs"
    ON public.weekly_logs FOR SELECT
    USING (
        pseudonym_id IN (
            SELECT pseudonym_id FROM public.user_profiles
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own weekly logs"
    ON public.weekly_logs FOR INSERT
    WITH CHECK (
        pseudonym_id IN (
            SELECT pseudonym_id FROM public.user_profiles
            WHERE auth_id = auth.uid()
        )
    );

-- 4. Remedy Logs (self-care tracking)
CREATE TABLE IF NOT EXISTS public.remedy_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pseudonym_id uuid NOT NULL,
    log_date date NOT NULL DEFAULT now()::date,
    remedy_name text NOT NULL,
    remedy_category text NOT NULL DEFAULT 'other',
    effectiveness int CHECK (effectiveness >= 0 AND effectiveness <= 10),
    duration_minutes int,
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.remedy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own remedy logs"
    ON public.remedy_logs FOR SELECT
    USING (
        pseudonym_id IN (
            SELECT pseudonym_id FROM public.user_profiles
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own remedy logs"
    ON public.remedy_logs FOR INSERT
    WITH CHECK (
        pseudonym_id IN (
            SELECT pseudonym_id FROM public.user_profiles
            WHERE auth_id = auth.uid()
        )
    );
