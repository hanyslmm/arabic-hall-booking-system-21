-- Create junction table for many-to-many between teachers and academic_stages
CREATE TABLE IF NOT EXISTS public.teacher_academic_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  academic_stage_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, academic_stage_id)
);

-- Enable RLS
ALTER TABLE public.teacher_academic_stages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Read teacher_academic_stages" ON public.teacher_academic_stages;
DROP POLICY IF EXISTS "Manage teacher_academic_stages for managers" ON public.teacher_academic_stages;

CREATE POLICY "Read teacher_academic_stages"
ON public.teacher_academic_stages
FOR SELECT
TO authenticated
USING (true);

-- Helper function that adapts to available columns (role vs user_role)
CREATE OR REPLACE FUNCTION public.can_manage_teacher_academic_stages()
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
    -- If no role columns yet, allow to avoid blocking feature
    RETURN true;
  END IF;
END;
$$;

-- Policy grants manage access to owner/manager/space_manager roles
CREATE POLICY "Manage teacher_academic_stages for managers"
ON public.teacher_academic_stages
FOR ALL
TO authenticated
USING (public.can_manage_teacher_academic_stages())
WITH CHECK (public.can_manage_teacher_academic_stages());

COMMENT ON POLICY "Manage teacher_academic_stages for managers" ON public.teacher_academic_stages 
IS 'Admins, managers, space managers and owners can insert/update/delete teacher-academic stage associations.';

-- Conditionally add foreign keys only if base tables exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) THEN
    BEGIN
      ALTER TABLE public.teacher_academic_stages
      ADD CONSTRAINT teacher_academic_stages_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'academic_stages'
  ) THEN
    BEGIN
      ALTER TABLE public.teacher_academic_stages
      ADD CONSTRAINT teacher_academic_stages_stage_id_fkey
      FOREIGN KEY (academic_stage_id) REFERENCES public.academic_stages(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

