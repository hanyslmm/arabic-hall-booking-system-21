-- Add new fields to teachers table and create subjects table
-- This migration enhances the teacher management system

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Add new fields to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id);

-- Create junction table for teachers and academic stages (many-to-many)
CREATE TABLE IF NOT EXISTS public.teacher_academic_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  academic_stage_id UUID REFERENCES public.academic_stages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, academic_stage_id)
);

-- Insert some default subjects
INSERT INTO public.subjects (name) VALUES
  ('الرياضيات'),
  ('العلوم'),
  ('الفيزياء'),
  ('الكيمياء'),
  ('الأحياء'),
  ('اللغة العربية'),
  ('اللغة الإنجليزية'),
  ('التاريخ'),
  ('الجغرافيا'),
  ('التربية الإسلامية'),
  ('الحاسوب'),
  ('التربية الفنية'),
  ('التربية البدنية')
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies for subjects table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read subjects
CREATE POLICY "Allow authenticated users to read subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert subjects
CREATE POLICY "Allow authenticated users to insert subjects"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update subjects
CREATE POLICY "Allow authenticated users to update subjects"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete subjects
CREATE POLICY "Allow authenticated users to delete subjects"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for teacher_academic_stages table
ALTER TABLE public.teacher_academic_stages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read teacher_academic_stages
CREATE POLICY "Allow authenticated users to read teacher_academic_stages"
  ON public.teacher_academic_stages FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert teacher_academic_stages
CREATE POLICY "Allow authenticated users to insert teacher_academic_stages"
  ON public.teacher_academic_stages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update teacher_academic_stages
CREATE POLICY "Allow authenticated users to update teacher_academic_stages"
  ON public.teacher_academic_stages FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete teacher_academic_stages
CREATE POLICY "Allow authenticated users to delete teacher_academic_stages"
  ON public.teacher_academic_stages FOR DELETE
  TO authenticated
  USING (true);
