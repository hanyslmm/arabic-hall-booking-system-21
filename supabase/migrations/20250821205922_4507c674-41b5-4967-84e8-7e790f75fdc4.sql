-- Fix teachers table and add missing columns/relationships

-- Add created_by column to teachers table if it doesn't exist
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_by uuid;

-- Create teacher_academic_stages junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_academic_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    academic_stage_id uuid REFERENCES public.academic_stages(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(teacher_id, academic_stage_id)
);

-- Enable RLS on teacher_academic_stages
ALTER TABLE public.teacher_academic_stages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Users can view teacher_academic_stages" ON public.teacher_academic_stages;
DROP POLICY IF EXISTS "Admins can manage teacher_academic_stages" ON public.teacher_academic_stages;

-- Create RLS policies for teacher_academic_stages
CREATE POLICY "Users can view teacher_academic_stages" 
ON public.teacher_academic_stages 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage teacher_academic_stages" 
ON public.teacher_academic_stages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON public.teacher_academic_stages TO authenticated;