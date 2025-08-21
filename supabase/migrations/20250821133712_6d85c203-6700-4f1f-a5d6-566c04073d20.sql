-- ==========================================
-- COMPLETE AUTH SYSTEM REBUILD MIGRATION - FIXED
-- ==========================================
-- This migration completely rebuilds the authentication and authorization system
-- to eliminate RLS recursion bugs and establish a clean security model.

BEGIN;

-- ==========================================
-- PART 1: COMPLETE DATABASE CLEANUP
-- ==========================================

-- 1.1: Delete all existing users (destructive operation)
TRUNCATE TABLE auth.users RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- 1.2: Drop all existing RLS policies on all public schema tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all RLS policies on all public schema tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 1.3: Drop legacy helper functions that cause recursion
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_claim(text) CASCADE;
DROP FUNCTION IF EXISTS public.guard_profile_role_changes() CASCADE;
DROP FUNCTION IF EXISTS public.check_user_admin_status() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_permissions() CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;

-- 1.4: Drop any existing triggers that might cause issues
DROP TRIGGER IF EXISTS trg_guard_profile_role_changes ON public.profiles;
DROP TRIGGER IF EXISTS protect_admin_role_trigger ON public.profiles;

-- ==========================================
-- PART 2: REBUILD AUTHORIZATION FOUNDATION
-- ==========================================

-- 2.1: Create simple admin check function (non-recursive)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Simple check using auth.jwt() claims without table lookups to avoid recursion
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role')::text IN ('owner', 'manager'),
    FALSE
  );
$$;

-- 2.2: Create function to set JWT claims
CREATE OR REPLACE FUNCTION public.set_user_claims()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  claims jsonb;
BEGIN
  -- Build custom claims
  claims := jsonb_build_object(
    'user_role', COALESCE(NEW.user_role::text, 'space_manager'),
    'full_name', COALESCE(NEW.full_name, ''),
    'email', COALESCE(NEW.email, '')
  );
  
  -- Update the user's raw_app_meta_data with custom claims
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || claims
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 2.3: Create trigger to automatically set JWT claims when profile changes
CREATE TRIGGER set_user_claims_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_claims();

-- ==========================================
-- PART 3: IMPLEMENT NEW RLS POLICIES
-- ==========================================

-- 3.1: Enable RLS on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3.2: Create unified admin policies for all tables
-- Profiles table policies
CREATE POLICY "Admins have full access"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Students table policies
CREATE POLICY "Admins have full access"
ON public.students
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.students
FOR SELECT
TO authenticated
USING (true);

-- Teachers table policies
CREATE POLICY "Admins have full access"
ON public.teachers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

-- Bookings table policies
CREATE POLICY "Admins have full access"
ON public.bookings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);

-- Halls table policies
CREATE POLICY "Admins have full access"
ON public.halls
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.halls
FOR SELECT
TO authenticated
USING (true);

-- Subjects table policies
CREATE POLICY "Admins have full access"
ON public.subjects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);

-- Academic stages table policies
CREATE POLICY "Admins have full access"
ON public.academic_stages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.academic_stages
FOR SELECT
TO authenticated
USING (true);

-- Student registrations table policies
CREATE POLICY "Admins have full access"
ON public.student_registrations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.student_registrations
FOR SELECT
TO authenticated
USING (true);

-- Payment records table policies
CREATE POLICY "Admins have full access"
ON public.payment_records
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.payment_records
FOR SELECT
TO authenticated
USING (true);

-- Attendance records table policies
CREATE POLICY "Admins have full access"
ON public.attendance_records
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read data"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (true);

-- Notifications table policies
CREATE POLICY "Admins have full access"
ON public.notifications
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Audit logs table policies (admin only)
CREATE POLICY "Admins have full access"
ON public.audit_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==========================================
-- PART 4: SEED INITIAL ADMIN USERS
-- ==========================================

-- 4.1: Create admin user (owner)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'admin@local.app',
    crypt('Voda@321', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"user_role": "owner"}'::jsonb,
    '{"full_name": "System Administrator"}'::jsonb
  ) RETURNING id INTO admin_user_id;
  
  -- Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_role,
    role
  ) VALUES (
    admin_user_id,
    'admin@local.app',
    'System Administrator',
    'owner'::user_role,
    'ADMIN'::app_role
  );
END $$;

-- 4.2: Create manager user (marwa)
DO $$
DECLARE
  marwa_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'marwa@local.app',
    crypt('Voda@654', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"user_role": "manager"}'::jsonb,
    '{"full_name": "Marwa Manager"}'::jsonb
  ) RETURNING id INTO marwa_user_id;
  
  -- Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_role,
    role
  ) VALUES (
    marwa_user_id,
    'marwa@local.app',
    'Marwa Manager',
    'manager'::user_role,
    'ADMIN'::app_role
  );
END $$;

-- ==========================================
-- PART 5: GRANT NECESSARY PERMISSIONS
-- ==========================================

-- Grant execute permissions on admin function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_claims() TO authenticated;

COMMIT;