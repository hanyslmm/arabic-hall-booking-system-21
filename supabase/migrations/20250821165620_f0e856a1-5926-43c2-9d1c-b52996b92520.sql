-- Fix infinite recursion in profiles RLS policies
-- The issue is that admin check functions are querying profiles table within profiles policies

-- Step 1: Drop all existing problematic policies and functions
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_write_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_write_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_create_admin" ON public.profiles;

-- Drop potentially problematic functions
DROP FUNCTION IF EXISTS public.check_user_admin_status();
DROP FUNCTION IF EXISTS public.check_is_admin();
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Step 2: Temporarily disable RLS to avoid blocking during policy creation
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create a simple, non-recursive admin check function using security definer
-- This function runs with elevated privileges and doesn't trigger RLS policies
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR user_role IN ('owner', 'manager'))
  );
$$;

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, safe policies that don't cause recursion
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "admins_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admins_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "admins_insert_profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;