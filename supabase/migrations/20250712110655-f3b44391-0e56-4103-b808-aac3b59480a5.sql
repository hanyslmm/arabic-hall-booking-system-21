-- Fix circular dependency and ensure admin privileges work properly
-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read own profile or admins to read all" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile or admins to update any" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or super admin can update any" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;

-- Drop functions that cause circular dependencies
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.can_read(UUID);
DROP FUNCTION IF EXISTS public.grant_admin_privileges(TEXT);
DROP FUNCTION IF EXISTS public.grant_readonly_privileges(TEXT);

-- Ensure admin accounts have proper privileges
UPDATE public.profiles 
SET 
  user_role = 'owner',
  role = 'ADMIN',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001' OR email = 'hanyslmm@gmail.com';

-- Create simple, non-recursive RLS policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated 
  USING (
    auth.uid() = '00000000-0000-0000-0000-000000000001' OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.email = 'hanyslmm@gmail.com' 
      AND p.role = 'ADMIN'
    )
  );

-- Update halls policies to allow admin management
DROP POLICY IF EXISTS "All authenticated users can view halls" ON public.halls;
DROP POLICY IF EXISTS "Admins can manage halls" ON public.halls;

CREATE POLICY "All users can view halls" ON public.halls
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage halls" ON public.halls
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'ADMIN' OR p.user_role IN ('owner', 'manager'))
    )
  );

-- Update teachers policies
DROP POLICY IF EXISTS "All authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

CREATE POLICY "All users can view teachers" ON public.teachers
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'ADMIN' OR p.user_role IN ('owner', 'manager'))
    )
  );

-- Update academic_stages policies
DROP POLICY IF EXISTS "All authenticated users can view academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Admins can manage academic stages" ON public.academic_stages;

CREATE POLICY "All users can view academic stages" ON public.academic_stages
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage academic stages" ON public.academic_stages
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'ADMIN' OR p.user_role IN ('owner', 'manager'))
    )
  );

-- Update bookings policies
DROP POLICY IF EXISTS "All authenticated users can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "All authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

CREATE POLICY "All users can view bookings" ON public.bookings
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "All users can create bookings" ON public.bookings
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (p.role = 'ADMIN' OR p.user_role IN ('owner', 'manager'))
    )
  );

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE TO authenticated 
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own bookings" ON public.bookings
  FOR DELETE TO authenticated 
  USING (created_by = auth.uid());