-- Create teacher_subjects junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

-- Enable RLS on teacher_subjects
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_subjects
CREATE POLICY "All authenticated users can view teacher subjects" 
ON public.teacher_subjects 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins, managers, and space_managers can manage teacher subjects" 
ON public.teacher_subjects 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.user_role IN ('owner', 'manager', 'space_manager')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.user_role IN ('owner', 'manager', 'space_manager')
    )
  )
);

-- Add subject_id column to daily_settlements for tracking teacher subjects in transactions
ALTER TABLE public.daily_settlements 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;