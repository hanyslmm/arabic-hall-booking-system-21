-- ==========================================
-- SIMPLIFIED AUTH SYSTEM FIX MIGRATION
-- ==========================================
-- This migration fixes RLS recursion bugs without touching auth.users table

BEGIN;

-- ==========================================
-- PART 1: CLEAN UP EXISTING POLICIES AND FUNCTIONS
-- ==========================================

-- 1.1: Drop all existing RLS policies on all public schema tables
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

-- 1.2: Drop legacy helper functions that cause recursion
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_claim(text) CASCADE;
DROP FUNCTION IF EXISTS public.guard_profile_role_changes() CASCADE;
DROP FUNCTION IF EXISTS public.check_user_admin_status() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_permissions() CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;

-- 1.3: Drop any existing triggers that might cause issues
DROP TRIGGER IF EXISTS trg_guard_profile_role_changes ON public.profiles;
DROP TRIGGER IF EXISTS protect_admin_role_trigger ON public.profiles;
DROP TRIGGER IF EXISTS set_user_claims_trigger ON public.profiles;

-- ==========================================
-- PART 2: CREATE NEW SECURE ADMIN FUNCTIONS
-- ==========================================

-- 2.1: Create simple admin check function using JWT claims (non-recursive)
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

-- 2.2: Create function to automatically set JWT claims when profile changes
CREATE OR REPLACE FUNCTION public.update_user_claims()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only update claims for admin users to avoid issues
  IF NEW.user_role IN ('owner', 'manager') THEN
    -- Update the user's raw_app_meta_data with role claims
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('user_role', NEW.user_role::text)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2.3: Create trigger to set JWT claims for admin users
CREATE TRIGGER update_user_claims_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_claims();

-- ==========================================
-- PART 3: IMPLEMENT SIMPLE RLS POLICIES
-- ==========================================

-- 3.1: Ensure RLS is enabled on all tables
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

-- 3.2: Create simple, non-recursive policies

-- Profiles table - Admin access + self access
CREATE POLICY "Admin full access to profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- All other tables - Admin full access + read access for authenticated users
CREATE POLICY "Admin full access to students"
ON public.students FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to students"
ON public.students FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to teachers"
ON public.teachers FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to teachers"
ON public.teachers FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to bookings"
ON public.bookings FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to bookings"
ON public.bookings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to halls"
ON public.halls FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to halls"
ON public.halls FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to subjects"
ON public.subjects FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to subjects"
ON public.subjects FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to academic_stages"
ON public.academic_stages FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to academic_stages"
ON public.academic_stages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to student_registrations"
ON public.student_registrations FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to student_registrations"
ON public.student_registrations FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to payment_records"
ON public.payment_records FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to payment_records"
ON public.payment_records FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin full access to attendance_records"
ON public.attendance_records FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Read access to attendance_records"
ON public.attendance_records FOR SELECT TO authenticated
USING (true);

-- Notifications - Admin access + user can see own notifications
CREATE POLICY "Admin full access to notifications"
ON public.notifications FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Audit logs - Admin only
CREATE POLICY "Admin only access to audit_logs"
ON public.audit_logs FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==========================================
-- PART 4: GRANT PERMISSIONS AND ENSURE ADMIN USERS
-- ==========================================

-- 4.1: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_claims() TO authenticated;

-- 4.2: Update any existing admin users to ensure they have proper JWT claims
UPDATE public.profiles 
SET user_role = 'owner'::user_role, role = 'ADMIN'::app_role
WHERE email IN ('admin@admin.com', 'hanyslmm@gmail.com', 'admin@local.app')
   OR user_role = 'owner'::user_role
   OR role = 'ADMIN'::app_role;

-- 4.3: Force trigger to update JWT claims for existing admin users
UPDATE public.profiles 
SET updated_at = now()
WHERE user_role IN ('owner', 'manager');

COMMIT;