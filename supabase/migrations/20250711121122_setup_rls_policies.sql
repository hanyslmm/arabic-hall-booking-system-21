-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.user_role = 'owner')
    )
  );

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.user_role = 'owner')
    )
  );

-- RLS Policies for halls
CREATE POLICY "All authenticated users can view halls" ON public.halls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can create halls" ON public.halls
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can update halls" ON public.halls
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can delete halls" ON public.halls
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

-- RLS Policies for teachers
CREATE POLICY "All authenticated users can view teachers" ON public.teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can create teachers" ON public.teachers
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can update teachers" ON public.teachers
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can delete teachers" ON public.teachers
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

-- RLS Policies for academic_stages
CREATE POLICY "All authenticated users can view academic stages" ON public.academic_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can create academic stages" ON public.academic_stages
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can update academic stages" ON public.academic_stages
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can delete academic stages" ON public.academic_stages
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager') OR profiles.role = 'ADMIN')
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
      AND (profiles.user_role IN ('owner', 'manager', 'space_manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can update bookings" ON public.bookings
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager', 'space_manager') OR profiles.role = 'ADMIN')
    )
  );

CREATE POLICY "Managers can delete bookings" ON public.bookings
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.user_role IN ('owner', 'manager', 'space_manager') OR profiles.role = 'ADMIN')
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.halls TO authenticated;
GRANT ALL ON public.teachers TO authenticated;
GRANT ALL ON public.academic_stages TO authenticated;
GRANT ALL ON public.bookings TO authenticated;

-- Allow authenticated users to use sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
