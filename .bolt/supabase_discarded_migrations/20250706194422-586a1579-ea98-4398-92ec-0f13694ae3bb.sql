-- Create custom types for roles and booking status
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'space_manager');
CREATE TYPE booking_status AS ENUM ('active', 'cancelled', 'completed');

-- Update profiles table to use the new role enum
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'space_manager';

-- Create halls table
CREATE TABLE public.halls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default halls data
INSERT INTO public.halls (name, capacity) VALUES
  ('القاعة الأولى', 90),
  ('القاعة الثانية', 70),
  ('القاعة الثالثة', 60),
  ('القاعة الرابعة', 30),
  ('القاعة الخامسة', 50),
  ('القاعة السادسة', 10),
  ('القاعة السابعة', 40);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create academic_stages table
CREATE TABLE public.academic_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Insert default academic stages
INSERT INTO public.academic_stages (name) VALUES
  ('الثانوية العامة'),
  ('المرحلة الابتدائية'),
  ('أطفال العلوم'),
  ('المرحلة الإعدادية'),
  ('المرحلة المتوسطة');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) NOT NULL,
  academic_stage_id UUID REFERENCES academic_stages(id) NOT NULL,
  hall_id UUID REFERENCES halls(id) NOT NULL,
  number_of_students INTEGER NOT NULL,
  days_of_week TEXT[] NOT NULL, -- Array of selected days
  start_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status booking_status DEFAULT 'active',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint to ensure number of students doesn't exceed hall capacity
  CONSTRAINT check_student_capacity CHECK (number_of_students > 0)
);

-- Enable RLS on all tables
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for halls (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view halls" ON public.halls
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for teachers
CREATE POLICY "All authenticated users can view teachers" ON public.teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners and managers can manage teachers" ON public.teachers
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- RLS Policies for academic_stages
CREATE POLICY "All authenticated users can view academic stages" ON public.academic_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners and managers can manage academic stages" ON public.academic_stages
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- RLS Policies for bookings
CREATE POLICY "All authenticated users can view bookings" ON public.bookings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can create bookings" ON public.bookings
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners and managers can update bookings" ON public.bookings
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners and managers can delete bookings" ON public.bookings
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- Create function to validate booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_hall_id UUID,
  p_start_time TIME,
  p_days_of_week TEXT[],
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.hall_id = p_hall_id
    AND b.start_time = p_start_time
    AND b.status = 'active'
    AND (p_booking_id IS NULL OR b.id != p_booking_id)
    AND b.days_of_week && p_days_of_week -- Array overlap operator
    AND (
      -- Check for date overlap
      (p_end_date IS NULL AND b.start_date <= p_start_date AND (b.end_date IS NULL OR b.end_date >= p_start_date)) OR
      (p_end_date IS NOT NULL AND b.start_date <= p_end_date AND (b.end_date IS NULL OR b.end_date >= p_start_date))
    )
  ) INTO conflict_exists;
  
  RETURN conflict_exists;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_stages_updated_at
  BEFORE UPDATE ON academic_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_halls_updated_at
  BEFORE UPDATE ON halls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();