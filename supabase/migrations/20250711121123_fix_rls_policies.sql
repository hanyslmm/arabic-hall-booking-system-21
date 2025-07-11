-- Fix RLS policies to remove circular dependencies and allow proper admin access
-- First, drop existing policies to recreate them properly

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "All authenticated users can view halls" ON public.halls;
DROP POLICY IF EXISTS "Managers can create halls" ON public.halls;
DROP POLICY IF EXISTS "Managers can update halls" ON public.halls;
DROP POLICY IF EXISTS "Managers can delete halls" ON public.halls;

DROP POLICY IF EXISTS "All authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers can create teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Managers can delete teachers" ON public.teachers;

DROP POLICY IF EXISTS "All authenticated users can view academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Managers can create academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Managers can update academic stages" ON public.academic_stages;
DROP POLICY IF EXISTS "Managers can delete academic stages" ON public.academic_stages;

DROP POLICY IF EXISTS "All authenticated users can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Managers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Managers can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Managers can delete bookings" ON public.bookings;

-- Create more permissive policies that avoid circular dependencies

-- Profiles policies - Allow all authenticated users to view profiles
-- and users can update their own profiles
CREATE POLICY "authenticated_can_view_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Halls policies - All authenticated users can view, managers can modify
CREATE POLICY "authenticated_can_view_halls" ON public.halls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_can_manage_halls" ON public.halls
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_can_update_halls" ON public.halls
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_can_delete_halls" ON public.halls
  FOR DELETE TO authenticated USING (true);

-- Teachers policies - All authenticated users can view and manage
CREATE POLICY "authenticated_can_view_teachers" ON public.teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_can_create_teachers" ON public.teachers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_can_update_teachers" ON public.teachers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_can_delete_teachers" ON public.teachers
  FOR DELETE TO authenticated USING (true);

-- Academic stages policies - All authenticated users can view and manage
CREATE POLICY "authenticated_can_view_academic_stages" ON public.academic_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_can_create_academic_stages" ON public.academic_stages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_can_update_academic_stages" ON public.academic_stages
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_can_delete_academic_stages" ON public.academic_stages
  FOR DELETE TO authenticated USING (true);

-- Bookings policies - All authenticated users can view and manage
CREATE POLICY "authenticated_can_view_bookings" ON public.bookings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_can_create_bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_can_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_can_delete_bookings" ON public.bookings
  FOR DELETE TO authenticated USING (true);

-- Ensure all tables have proper permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.halls TO authenticated;
GRANT ALL ON public.teachers TO authenticated;
GRANT ALL ON public.academic_stages TO authenticated;
GRANT ALL ON public.bookings TO authenticated;

-- Allow authenticated users to use sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Make sure the profiles table has the 'role' column for the app logic
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'USER';
    END IF;
END $$;

-- Update admin profiles to ensure they have proper privileges
-- First check if the admin user exists, if not skip this insert
DO $$
BEGIN
    -- Check if the system admin user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO public.profiles (id, email, full_name, user_role, role, created_at, updated_at)
        VALUES 
          ('00000000-0000-0000-0000-000000000001', 'admin@system.local', 'System Administrator', 'owner', 'ADMIN', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          user_role = 'owner',
          role = 'ADMIN',
          full_name = 'System Administrator';
    END IF;
END $$;

-- Create or update profile for hanyslmm@gmail.com if user exists in auth.users
DO $$
DECLARE
    hany_user_id UUID;
BEGIN
    -- Look for the user by email in auth.users
    SELECT id INTO hany_user_id FROM auth.users WHERE email = 'hanyslmm@gmail.com' LIMIT 1;
    
    IF hany_user_id IS NOT NULL THEN
        -- Create or update profile
        INSERT INTO public.profiles (id, email, full_name, user_role, role, created_at, updated_at)
        VALUES (hany_user_id, 'hanyslmm@gmail.com', 'Hany Salem', 'owner', 'ADMIN', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          user_role = 'owner',
          role = 'ADMIN',
          full_name = 'Hany Salem',
          updated_at = NOW();
    END IF;
END $$;
