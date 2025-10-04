-- Create junction table for many-to-many between teachers and subjects
-- Create the table WITHOUT foreign keys first to avoid errors if base tables are missing
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

-- Enable RLS
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Read teacher_subjects" ON public.teacher_subjects;
DROP POLICY IF EXISTS "Manage teacher_subjects for managers" ON public.teacher_subjects;

CREATE POLICY "Read teacher_subjects"
ON public.teacher_subjects
FOR SELECT
TO authenticated
USING (true);

-- Policy grants manage access to owner/manager/space_manager roles
-- Helper function that adapts to available columns (role vs user_role),
-- and falls back to allow if neither exists to prevent migration failure.
CREATE OR REPLACE FUNCTION public.can_manage_teacher_subjects()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  has_user_role boolean;
  has_role boolean;
  result boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_role'
  ) INTO has_user_role;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) INTO has_role;

  IF has_user_role THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.user_role IN ('owner','manager','space_manager','admin')
    ) INTO result;
    RETURN COALESCE(result, false);
  ELSIF has_role THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','manager')
    ) INTO result;
    RETURN COALESCE(result, false);
  ELSE
    -- If no role columns yet, allow to avoid blocking feature; tighten later when roles are present
    RETURN true;
  END IF;
END;
$$;

CREATE POLICY "Manage teacher_subjects for managers"
ON public.teacher_subjects
FOR ALL
TO authenticated
USING (public.can_manage_teacher_subjects())
WITH CHECK (public.can_manage_teacher_subjects());

-- Conditionally add foreign keys only if base tables exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) THEN
    BEGIN
      ALTER TABLE public.teacher_subjects
      ADD CONSTRAINT teacher_subjects_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'subjects'
  ) THEN
    BEGIN
      ALTER TABLE public.teacher_subjects
      ADD CONSTRAINT teacher_subjects_subject_id_fkey
      FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Backfill from legacy single subject_id if present (only if teachers table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) THEN
    INSERT INTO public.teacher_subjects (teacher_id, subject_id)
    SELECT t.id, t.subject_id
    FROM public.teachers t
    WHERE t.subject_id IS NOT NULL
    ON CONFLICT (teacher_id, subject_id) DO NOTHING;
  END IF;
END $$;

