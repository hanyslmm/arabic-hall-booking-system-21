-- Fix infinite recursion in profiles RLS policies and ensure admin access

-- Step 1: Drop all existing problematic policies on profiles table
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Step 2: Create security definer function to safely check admin status
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  -- Direct query without RLS to avoid recursion
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND (p.role = 'admin' OR p.user_role IN ('owner', 'manager'))
  );
$$;

-- Step 3: Temporarily disable RLS to create/update admin profile
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Ensure admin profile exists with proper privileges
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  user_role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@admin.com',
  'System Administrator',
  'admin',
  'owner',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@admin.com',
  full_name = 'System Administrator',
  role = 'admin',
  user_role = 'owner',
  updated_at = NOW();

-- Step 5: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create safe RLS policies using the security definer function
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.check_user_is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.check_user_is_admin())
WITH CHECK (public.check_user_is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_is_admin());

-- Step 7: Update is_admin_user function to use the safe approach
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT public.check_user_is_admin();
$$;