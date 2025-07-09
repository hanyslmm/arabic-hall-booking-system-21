-- Consolidated Arabic Hall Booking System Database Schema
-- This script creates the complete database schema idempotently

-- Create custom types
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('owner', 'manager', 'space_manager');
CREATE TYPE IF NOT EXISTS booking_status AS ENUM ('active', 'cancelled', 'completed');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_role user_role DEFAULT 'space_manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create halls table
CREATE TABLE IF NOT EXISTS public.halls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on halls
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create academic_stages table
CREATE TABLE IF NOT EXISTS public.academic_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on academic_stages
ALTER TABLE public.academic_stages ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hall_id UUID REFERENCES public.halls(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  academic_stage_id UUID REFERENCES public.academic_stages(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  notes TEXT,
  status booking_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(hall_id, period, day_of_week)
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for halls
CREATE POLICY IF NOT EXISTS "Anyone can view halls" ON public.halls FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Managers can manage halls" ON public.halls FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_role IN ('owner', 'manager')
  )
);

-- Create RLS policies for teachers
CREATE POLICY IF NOT EXISTS "Anyone can view teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create teachers" ON public.teachers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can update teachers they created" ON public.teachers FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete teachers they created" ON public.teachers FOR DELETE USING (created_by = auth.uid());

-- Create RLS policies for academic_stages
CREATE POLICY IF NOT EXISTS "Anyone can view academic stages" ON public.academic_stages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create academic stages" ON public.academic_stages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can update academic stages they created" ON public.academic_stages FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete academic stages they created" ON public.academic_stages FOR DELETE USING (created_by = auth.uid());

-- Create RLS policies for bookings
CREATE POLICY IF NOT EXISTS "Anyone can view bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can update bookings they created" ON public.bookings FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete bookings they created" ON public.bookings FOR DELETE USING (created_by = auth.uid());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default halls data (only if they don't exist)
INSERT INTO public.halls (name, capacity) 
SELECT name, capacity FROM (
  VALUES
    ('القاعة الأولى', 90),
    ('القاعة الثانية', 70),
    ('القاعة الثالثة', 60),
    ('القاعة الرابعة', 30),
    ('القاعة الخامسة', 50),
    ('القاعة السادسة', 10),
    ('القاعة السابعة', 40),
    ('قاعة المختبر', 30),
    ('القاعة الكبرى', 120),
    ('قاعة الاجتماعات', 25),
    ('قاعة الحاسوب', 40)
) AS v(name, capacity)
WHERE NOT EXISTS (SELECT 1 FROM public.halls WHERE halls.name = v.name);

-- Insert default academic stages (only if they don't exist)
INSERT INTO public.academic_stages (name) 
SELECT name FROM (
  VALUES
    ('الصف الأول الابتدائي'),
    ('الصف الثاني الابتدائي'),
    ('الصف الثالث الابتدائي'),
    ('الصف الرابع الابتدائي'),
    ('الصف الخامس الابتدائي'),
    ('الصف السادس الابتدائي'),
    ('الصف الأول المتوسط'),
    ('الصف الثاني المتوسط'),
    ('الصف الثالث المتوسط'),
    ('الصف الأول الثانوي'),
    ('الصف الثاني الثانوي'),
    ('الصف الثالث الثانوي'),
    ('الثانوية العامة'),
    ('المرحلة الابتدائية'),
    ('أطفال العلوم'),
    ('المرحلة الإعدادية'),
    ('المرحلة المتوسطة')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.academic_stages WHERE academic_stages.name = v.name);

-- Insert sample teachers (only if they don't exist)
INSERT INTO public.teachers (name) 
SELECT name FROM (
  VALUES
    ('أحمد محمد السالم'),
    ('فاطمة علي الحربي'),
    ('محمد عبدالله النجار'),
    ('نورا سعد الغامدي'),
    ('عبدالرحمن خالد العتيبي'),
    ('هند محمد الدوسري'),
    ('سعد أحمد المطيري'),
    ('عائشة عبدالعزيز القحطاني')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.teachers WHERE teachers.name = v.name);
