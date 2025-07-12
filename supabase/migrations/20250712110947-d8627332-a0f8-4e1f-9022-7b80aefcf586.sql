-- Complete fix for admin privileges and circular dependency
-- Remove ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Ensure the admin user exists and has proper privileges
INSERT INTO public.profiles (id, email, full_name, role, user_role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@admin.com',
  'System Administrator',
  'ADMIN',
  'owner',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  user_role = EXCLUDED.user_role,
  updated_at = NOW();

-- Also ensure hanyslmm@gmail.com has admin privileges
UPDATE public.profiles 
SET 
  user_role = 'owner',
  role = 'ADMIN',
  updated_at = NOW()
WHERE email = 'hanyslmm@gmail.com';

-- Create simple policies that don't cause recursion
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Simple deletion policy for admins only
CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE TO authenticated 
  USING (
    auth.uid() = '00000000-0000-0000-0000-000000000001' OR
    (
      SELECT email FROM public.profiles WHERE id = auth.uid() LIMIT 1
    ) = 'hanyslmm@gmail.com'
  );